import { supabase } from "@/lib/supabase";

export interface POIPoint {
  name: string;
  lat: number;
  lon: number;
  elevation?: number;
  description?: string;
  type:
    | "start"
    | "end"
    | "viewpoint"
    | "rest"
    | "landmark"
    | "water"
    | "food"
    | "danger"
    | "waypoint";
}

export interface TrailPoint {
  lat: number;
  lon: number;
  ele: number;
  distance: number; // 누적 거리 (km)
}

export interface TrailStats {
  totalDistance: number; // km
  elevationGain: number; // m
  elevationLoss: number; // m
  maxElevation: number; // m
  minElevation: number; // m
  estimatedTime: number; // hours
  difficulty: "Easy" | "Moderate" | "Hard";
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface TrailData {
  name: string;
  points: TrailPoint[];
  stats: TrailStats;
  geoJSON: GeoJSON.FeatureCollection;
  pois: POIPoint[];
}

// 두 점 사이의 거리 계산 (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 바운더리에 기반한 줌 레벨 계산
export function calculateZoomLevel(bounds: TrailStats["bounds"]): number {
  const latDiff = bounds.maxLat - bounds.minLat;
  const lonDiff = bounds.maxLon - bounds.minLon;
  const maxDiff = Math.max(latDiff, lonDiff);

  if (maxDiff > 0.1) return 10;
  if (maxDiff > 0.05) return 11;
  if (maxDiff > 0.025) return 12;
  if (maxDiff > 0.0125) return 13;
  if (maxDiff > 0.00625) return 14;
  return 15;
}

// 난이도 계산
function calculateDifficulty(
  distance: number,
  elevationGain: number
): "Easy" | "Moderate" | "Hard" {
  const score = distance * 0.3 + elevationGain * 0.001;

  if (score < 2) return "Easy";
  if (score < 5) return "Moderate";
  return "Hard";
}

// 예상 소요 시간 계산 (hours)
function calculateEstimatedTime(
  distance: number,
  elevationGain: number
): number {
  // 평지 기준 시속 4km + 고도 100m당 15분 추가
  const baseTime = distance / 4; // hours
  const elevationTime = (elevationGain / 100) * 0.25; // hours
  return baseTime + elevationTime;
}

export async function loadGPXData(courseId: string): Promise<TrailData> {
  try {
    // 코스 데이터 가져오기
    const { data: courseData, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    if (!courseData) throw new Error("Course not found");

    let points: TrailPoint[] = [];
    let coordinates: number[][] = [];

    // 새로운 gpx_data JSONB 구조 확인
    if (courseData.gpx_data && courseData.gpx_data.points) {
      try {
        const gpxPoints = courseData.gpx_data.points;
        let cumulativeDistance = 0;
        points = gpxPoints.map(
          (coord: { lat: number; lng: number; ele?: number }, index: number) => {
            if (index > 0) {
              const prevCoord = gpxPoints[index - 1];
              cumulativeDistance += calculateDistance(
                prevCoord.lat,
                prevCoord.lng,
                coord.lat,
                coord.lng
              );
            }

            return {
              lat: coord.lat,
              lon: coord.lng, // lng를 lon으로 변환
              ele: coord.ele || 100, // 실제 고도 데이터 사용
              distance: cumulativeDistance,
            };
          }
        );

        coordinates = points.map((p) => [p.lon, p.lat, p.ele]);
      } catch (parseError) {
        console.error("GPX 데이터 파싱 오류:", parseError);
        // 파싱 실패 시 시작점만 사용
        points = [
          {
            lat: courseData.start_latitude,
            lon: courseData.start_longitude,
            ele: 100,
            distance: 0,
          },
        ];
        coordinates = [
          [courseData.start_longitude, courseData.start_latitude, 100],
        ];
      }
    } else if (courseData.gpx_coordinates) {
      // 구형 gpx_coordinates 컬럼 fallback (하위호환성)
      try {
        const gpxCoords = JSON.parse(courseData.gpx_coordinates);
        let cumulativeDistance = 0;
        points = gpxCoords.map(
          (coord: { lat: number; lng: number; ele: number }, index: number) => {
            if (index > 0) {
              const prevCoord = gpxCoords[index - 1];
              cumulativeDistance += calculateDistance(
                prevCoord.lat,
                prevCoord.lng,
                coord.lat,
                coord.lng
              );
            }

            return {
              lat: coord.lat,
              lon: coord.lng,
              ele: coord.ele || 100,
              distance: cumulativeDistance,
            };
          }
        );

        coordinates = points.map((p) => [p.lon, p.lat, p.ele]);
      } catch (parseError) {
        console.error("구형 GPX 좌표 파싱 오류:", parseError);
        points = [
          {
            lat: courseData.start_latitude,
            lon: courseData.start_longitude,
            ele: 100,
            distance: 0,
          },
        ];
        coordinates = [
          [courseData.start_longitude, courseData.start_latitude, 100],
        ];
      }
    } else {
      // GPX 데이터가 없으면 시작점만 사용
      points = [
        {
          lat: courseData.start_latitude,
          lon: courseData.start_longitude,
          ele: 100,
          distance: 0,
        },
      ];
      coordinates = [
        [courseData.start_longitude, courseData.start_latitude, 100],
      ];
    }

    // 통계 계산 (gpx_data의 stats 우선 사용)
    let totalDistance = courseData.distance_km || 0;
    let elevationGain = courseData.elevation_gain || 100;
    let bounds;

    // 새로운 gpx_data 구조에서 통계 사용
    if (courseData.gpx_data && courseData.gpx_data.stats) {
      totalDistance = courseData.gpx_data.stats.totalDistance || totalDistance;
      elevationGain = courseData.gpx_data.stats.elevationGain || elevationGain;
    } else if (points.length > 1) {
      totalDistance = points[points.length - 1].distance;
    }

    // bounds 계산 (gpx_data의 bounds 우선 사용)
    if (courseData.gpx_data && courseData.gpx_data.bounds) {
      bounds = {
        minLat: courseData.gpx_data.bounds.minLat,
        maxLat: courseData.gpx_data.bounds.maxLat,
        minLon: courseData.gpx_data.bounds.minLng,
        maxLon: courseData.gpx_data.bounds.maxLng,
      };
    } else {
      bounds = {
        minLat: Math.min(...points.map((p) => p.lat)),
        maxLat: Math.max(...points.map((p) => p.lat)),
        minLon: Math.min(...points.map((p) => p.lon)),
        maxLon: Math.max(...points.map((p) => p.lon)),
      };
    }

    const elevations = points.map((p) => p.ele);
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    const elevationLoss = elevationGain * 0.8; // 추정값

    const stats: TrailStats = {
      totalDistance,
      elevationGain,
      elevationLoss,
      maxElevation,
      minElevation,
      estimatedTime: calculateEstimatedTime(totalDistance, elevationGain),
      difficulty: calculateDifficulty(totalDistance, elevationGain),
      bounds,
    };

    // GeoJSON 생성
    const geoJSON: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      ],
    };

    // POI 생성 (시작점과 끝점)
    const pois: POIPoint[] = [
      {
        name: "시작점",
        lat: points[0].lat,
        lon: points[0].lon,
        elevation: points[0].ele,
        type: "start",
      },
    ];

    // 끝점이 시작점과 다른 경우에만 추가
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      if (lastPoint.lat !== points[0].lat || lastPoint.lon !== points[0].lon) {
        pois.push({
          name: "도착점",
          lat: lastPoint.lat,
          lon: lastPoint.lon,
          elevation: lastPoint.ele,
          type: "end",
        });
      }
    }

    return {
      name: courseData.title,
      points,
      stats,
      geoJSON,
      pois,
    };
  } catch (error) {
    console.error("Failed to load GPX data:", error);
    throw error;
  }
}
