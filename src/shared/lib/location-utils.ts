// 좌표에서 동 이름을 추출하는 유틸리티

interface LocationInfo {
  dong: string;
  fullAddress: string;
  details: {
    region1: string;
    region2: string;
    region3: string;
  };
}

// 메모이제이션을 위한 캐시
const locationCache = new Map<string, LocationInfo | null>();

// 좌표를 캐시 키로 변환 (소수점 6자리로 반올림하여 정확도 유지)
function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

// 카카오 지오코딩 API를 사용해서 좌표를 동 이름으로 변환 (캐시 적용)
export async function getLocationFromCoords(
  lat: number,
  lng: number,
): Promise<LocationInfo | null> {
  const cacheKey = getCacheKey(lat, lng);

  // 캐시에서 확인
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey) || null;
  }

  try {
    const response = await fetch(`/api/geocoding/dong?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      console.error("Failed to get location info:", response.status);
      locationCache.set(cacheKey, null);
      return null;
    }

    const data = await response.json();
    locationCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching location:", error);
    locationCache.set(cacheKey, null);
    return null;
  }
}

// 여러 좌표들에서 동 이름들을 추출하고 유니크한 동들만 반환
export async function getUniqueDongsFromCoords(
  coords: Array<{ lat: number; lng: number }>,
): Promise<string[]> {
  if (coords.length === 0) return [];

  // 1. 먼저 좌표 레벨에서 중복 제거 (캐시 키 기준)
  const uniqueCoords = coords.reduce((acc, coord) => {
    const key = getCacheKey(coord.lat, coord.lng);
    if (!acc.has(key)) {
      acc.set(key, coord);
    }
    return acc;
  }, new Map<string, { lat: number; lng: number }>());

  // 2. 유니크한 좌표들에 대해서만 API 호출
  const dongPromises = Array.from(uniqueCoords.values()).map((coord) =>
    getLocationFromCoords(coord.lat, coord.lng),
  );

  try {
    const results = await Promise.all(dongPromises);
    const dongs = results
      .filter((result): result is LocationInfo => result !== null)
      .map((result) => result.dong);

    // 3. 동 이름 중복 제거
    const uniqueDongs = Array.from(new Set(dongs));

    return uniqueDongs;
  } catch (error) {
    console.error("Error getting unique dongs:", error);
    return [];
  }
}

// 코스들에서 동 이름들을 추출
export async function getDongsFromCourses(
  courses: Array<{ start_latitude: number; start_longitude: number }>,
): Promise<string[]> {
  const coords = courses.map((course) => ({
    lat: course.start_latitude,
    lng: course.start_longitude,
  }));

  return getUniqueDongsFromCoords(coords);
}
