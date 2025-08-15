"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mountain, 
  Route, 
  Timer, 
  MapPin,
  Flag,
  ZoomIn, 
  ZoomOut, 
  Compass
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Course, CoursePoint } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface TrailMapProps {
  courseId: string;
  className?: string;
}

interface TrailData {
  course: Course;
  points: CoursePoint[];
  geoJSON: any;
  stats: {
    totalDistance: number;
    elevationGain: number;
    estimatedTime: number;
    maxElevation: number;
    minElevation: number;
    elevationLoss: number;
    difficulty: string;
    bounds: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  };
}

const TrailMapDB: React.FC<TrailMapProps> = ({ courseId, className = '' }) => {
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  
  const [viewState, setViewState] = useState({
    longitude: 129.0,
    latitude: 35.2,
    zoom: 14,
    pitch: 0,
    bearing: 0
  });

  // DB에서 코스 데이터 로드
  const loadCourseData = async (courseId: string): Promise<TrailData> => {
    // 1. 코스 기본 정보 로드
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_active', true)
      .single();

    if (courseError || !course) {
      throw new Error('코스를 찾을 수 없습니다.');
    }

    // 2. 코스 포인트 로드
    const { data: points, error: pointsError } = await supabase
      .from('course_points')
      .select('*')
      .eq('course_id', courseId)
      .order('seq', { ascending: true });

    if (pointsError) {
      throw new Error('코스 경로 데이터를 불러올 수 없습니다.');
    }

    // 3. 데이터가 없으면 gpx_coordinates에서 fallback
    let finalPoints = points || [];
    if ((!points || points.length === 0) && course.gpx_coordinates) {
      try {
        const coordinates = JSON.parse(course.gpx_coordinates);
        finalPoints = coordinates.map((coord: any, index: number) => ({
          id: `${courseId}-${index}`,
          course_id: courseId,
          seq: index,
          latitude: coord.lat,
          longitude: coord.lng || coord.lon,
          elevation: coord.ele || null,
          created_at: course.created_at
        }));
      } catch (e) {
        console.error('GPX coordinates parsing error:', e);
      }
    }

    if (finalPoints.length === 0) {
      throw new Error('코스 경로 데이터가 없습니다.');
    }

    // 4. GeoJSON 생성
    const geoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: finalPoints.map(p => [p.longitude, p.latitude, p.elevation || 0])
        }
      }]
    };

    // 5. 통계 계산
    const stats = calculateStats(finalPoints, course);

    return {
      course,
      points: finalPoints,
      geoJSON,
      stats
    };
  };

  // 통계 계산 함수
  const calculateStats = (points: CoursePoint[], course: Course) => {
    const elevations = points.filter(p => p.elevation).map(p => p.elevation!);
    const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;
    const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;

    // 고도 상승/하강 계산
    let elevationGain = 0;
    let elevationLoss = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].elevation && points[i-1].elevation) {
        const diff = points[i].elevation! - points[i-1].elevation!;
        if (diff > 0) elevationGain += diff;
        else elevationLoss += Math.abs(diff);
      }
    }

    // 경계 계산
    const bounds = {
      minLat: Math.min(...points.map(p => p.latitude)),
      maxLat: Math.max(...points.map(p => p.latitude)),
      minLon: Math.min(...points.map(p => p.longitude)),
      maxLon: Math.max(...points.map(p => p.longitude))
    };

    // 난이도 텍스트 변환
    const difficultyMap = {
      'easy': 'Easy',
      'medium': 'Moderate', 
      'hard': 'Hard'
    };

    return {
      totalDistance: course.distance_km,
      elevationGain: course.elevation_gain || elevationGain,
      estimatedTime: (course.avg_time_min || 60) / 60, // 시간 단위로 변환
      maxElevation,
      minElevation,
      elevationLoss,
      difficulty: difficultyMap[course.difficulty] || course.difficulty,
      bounds
    };
  };

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await loadCourseData(courseId);
        setTrailData(data);
        
        // 지도 중심과 줌 레벨 설정
        const bounds = data.stats.bounds;
        const centerLon = (bounds.minLon + bounds.maxLon) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        
        // 줌 레벨 계산
        const latDiff = bounds.maxLat - bounds.minLat;
        const lonDiff = bounds.maxLon - bounds.minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        let zoom = 14;
        if (maxDiff < 0.001) zoom = 17;
        else if (maxDiff < 0.005) zoom = 16;
        else if (maxDiff < 0.01) zoom = 15;
        else if (maxDiff < 0.05) zoom = 13;
        
        setViewState(prev => ({
          ...prev,
          longitude: centerLon,
          latitude: centerLat,
          zoom: Math.min(zoom + 1, 17)
        }));
        
      } catch (err) {
        console.error('Failed to load trail data:', err);
        setError(err instanceof Error ? err.message : '트레일 데이터를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId]);

  // 지도 줌 컨트롤
  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomOut();
    }
  }, []);

  const resetNorth = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      bearing: 0
    }));
  }, []);

  // 트레일 중심으로 이동
  const fitToTrail = useCallback(() => {
    if (trailData && mapRef.current) {
      const bounds = trailData.stats.bounds;
      const map = mapRef.current.getMap();
      
      // 시작점과 도착점이 모두 보이도록 bounds 설정
      const padding = 0.001;
      const adjustedBounds = {
        minLon: bounds.minLon - padding,
        maxLon: bounds.maxLon + padding,
        minLat: bounds.minLat - padding,
        maxLat: bounds.maxLat + padding
      };
      
      map.fitBounds(
        [[adjustedBounds.minLon, adjustedBounds.minLat], 
         [adjustedBounds.maxLon, adjustedBounds.maxLat]],
        {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          pitch: 0,
          bearing: 0,
          duration: 1000,
          essential: true
        }
      );
    }
  }, [trailData]);

  // 트레일 라인 스타일
  const trailLineLayer = {
    id: 'trail-line',
    type: 'line' as const,
    paint: {
      'line-color': '#ff6b35',
      'line-width': 4,
      'line-opacity': 0.8
    },
    layout: {
      'line-join': 'round' as const,
      'line-cap': 'round' as const
    }
  };

  const trailOutlineLayer = {
    id: 'trail-outline',
    type: 'line' as const,
    paint: {
      'line-color': '#333333',
      'line-width': 6,
      'line-opacity': 0.6
    },
    layout: {
      'line-join': 'round' as const,
      'line-cap': 'round' as const
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !trailData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Mountain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              트레일 지도를 로드할 수 없습니다
            </h3>
            <p className="text-gray-500">
              {error || '코스 데이터를 찾을 수 없습니다.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardContent className="p-0">
          {/* 헤더 */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {trailData.course.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Route className="w-4 h-4" />
                    <span>{trailData.stats.totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mountain className="w-4 h-4" />
                    <span>+{trailData.stats.elevationGain.toFixed(0)}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    <span>{formatTime(trailData.stats.estimatedTime)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fitToTrail}
                  className="text-xs"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  전체보기
                </Button>
              </div>
            </div>
          </div>

          {/* 지도 */}
          <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
            <Map
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/light-v11"
              doubleClickZoom={false}
              attributionControl={false}
            >
              {/* 커스텀 네비게이션 컨트롤 */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
                  title="확대"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
                  title="축소"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetNorth}
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
                  title="북쪽으로 회전"
                >
                  <Compass className="w-4 h-4" />
                </Button>
              </div>
              
              {/* 트레일 레이어 */}
              {trailData.geoJSON && (
                <Source 
                  id="trail" 
                  type="geojson" 
                  data={trailData.geoJSON}
                >
                  <Layer {...trailOutlineLayer} />
                  <Layer {...trailLineLayer} />
                </Source>
              )}
              
              {/* 시작점 마커 */}
              {trailData.course.start_latitude && trailData.course.start_longitude && (
                <Marker
                  longitude={trailData.course.start_longitude}
                  latitude={trailData.course.start_latitude}
                  anchor="bottom"
                >
                  <div className="bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
                    <Flag className="w-4 h-4" />
                  </div>
                </Marker>
              )}

              {/* 종료점 마커 */}
              {trailData.course.end_latitude && trailData.course.end_longitude && (
                <Marker
                  longitude={trailData.course.end_longitude}
                  latitude={trailData.course.end_latitude}
                  anchor="bottom"
                >
                  <div className="bg-red-500 text-white rounded-full p-2 shadow-lg border-2 border-white">
                    <Flag className="w-4 h-4" />
                  </div>
                </Marker>
              )}
            </Map>
            
            {/* 저작권 표시 */}
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">
              © Mapbox © OpenStreetMap
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrailMapDB;