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

// 카카오 지오코딩 API를 사용해서 좌표를 동 이름으로 변환
export async function getLocationFromCoords(lat: number, lng: number): Promise<LocationInfo | null> {
  try {
    const response = await fetch(`/api/geocoding/dong?lat=${lat}&lng=${lng}`);
    
    if (!response.ok) {
      console.error('Failed to get location info:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}

// 여러 좌표들에서 동 이름들을 추출하고 유니크한 동들만 반환
export async function getUniqueDongsFromCoords(
  coords: Array<{ lat: number; lng: number }>
): Promise<string[]> {
  const dongPromises = coords.map(coord => getLocationFromCoords(coord.lat, coord.lng));
  
  try {
    const results = await Promise.all(dongPromises);
    const dongs = results
      .filter((result): result is LocationInfo => result !== null)
      .map(result => result.dong);
    
    // 중복 제거
    return Array.from(new Set(dongs));
  } catch (error) {
    console.error('Error getting unique dongs:', error);
    return [];
  }
}

// 코스들에서 동 이름들을 추출
export async function getDongsFromCourses(
  courses: Array<{ start_latitude: number; start_longitude: number }>
): Promise<string[]> {
  const coords = courses.map(course => ({
    lat: course.start_latitude,
    lng: course.start_longitude,
  }));
  
  return getUniqueDongsFromCoords(coords);
}