/**
 * GPX 경로 중복 검사 유틸리티
 */

export interface CourseForDuplicateCheck {
  id: string;
  title: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  avg_time_min: number;
  difficulty: string;
  gpx_data?: {
    points?: Array<{ lat: number; lng: number; ele?: number }>;
  };
}

export interface DuplicateCheckResult {
  proceed: boolean | "CONFIRM"; // true: 진행, false: 차단, CONFIRM: 사용자 확인 필요
  type?: "DUPLICATE" | "VERY_SIMILAR" | "SIMILAR";
  existingCourse?: CourseForDuplicateCheck;
  existingCourses?: CourseForDuplicateCheck[];
  message?: string;
}

// 좌표가 "비슷한" 것으로 판단하는 임계값 (약 11m 오차 허용)
const COORDINATE_THRESHOLD = 0.0001;

// 거리 차이 임계값 (100m)
const DISTANCE_THRESHOLD_KM = 0.1;

// 시간 차이 임계값 (5분)
const TIME_THRESHOLD_MIN = 5;

/**
 * 두 좌표가 같은지 판단 (임계값 고려)
 */
function coordinatesMatch(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): boolean {
  return (
    Math.abs(lat1 - lat2) < COORDINATE_THRESHOLD &&
    Math.abs(lng1 - lng2) < COORDINATE_THRESHOLD
  );
}

/**
 * 시작점과 끝점이 같은지 판단
 */
export function isSameStartEnd(
  course1: CourseForDuplicateCheck,
  course2: CourseForDuplicateCheck,
): boolean {
  // 끝점 계산
  const end1 = getEndPoint(course1);
  const end2 = getEndPoint(course2);

  if (!end1 || !end2) return false;

  const startMatch = coordinatesMatch(
    course1.start_latitude,
    course1.start_longitude,
    course2.start_latitude,
    course2.start_longitude,
  );

  const endMatch = coordinatesMatch(end1.lat, end1.lng, end2.lat, end2.lng);

  return startMatch && endMatch;
}

/**
 * 끝점 좌표 가져오기
 */
function getEndPoint(
  course: CourseForDuplicateCheck,
): { lat: number; lng: number } | null {
  const points = course.gpx_data?.points;
  if (!points || points.length === 0) return null;

  const lastPoint = points[points.length - 1];
  return { lat: lastPoint.lat, lng: lastPoint.lng };
}

/**
 * 거리도 비슷한지 판단
 */
export function isSimilarRoute(
  course1: CourseForDuplicateCheck,
  course2: CourseForDuplicateCheck,
): boolean {
  const sameStartEnd = isSameStartEnd(course1, course2);
  const distanceDiff = Math.abs(course1.distance_km - course2.distance_km);

  return sameStartEnd && distanceDiff < DISTANCE_THRESHOLD_KM;
}

/**
 * 완전히 동일한 코스인지 판단
 */
export function isDuplicateRoute(
  course1: CourseForDuplicateCheck,
  course2: CourseForDuplicateCheck,
): boolean {
  return (
    course1.title.trim().toLowerCase() === course2.title.trim().toLowerCase() &&
    isSimilarRoute(course1, course2) &&
    course1.difficulty === course2.difficulty &&
    Math.abs(course1.avg_time_min - course2.avg_time_min) < TIME_THRESHOLD_MIN
  );
}

/**
 * 기존 코스 목록과 비교하여 중복 검사
 */
export function checkForDuplicates(
  newCourse: CourseForDuplicateCheck,
  existingCourses: CourseForDuplicateCheck[],
): DuplicateCheckResult {
  if (existingCourses.length === 0) {
    return { proceed: true };
  }

  // 1. 완전 동일 체크
  const duplicate = existingCourses.find((c) => isDuplicateRoute(c, newCourse));
  if (duplicate) {
    return {
      proceed: false,
      type: "DUPLICATE",
      existingCourse: duplicate,
      message: "완전히 동일한 코스가 있습니다",
    };
  }

  // 2. 매우 유사 체크 (시작/끝 + 거리 비슷)
  const verySimilar = existingCourses.find((c) => isSimilarRoute(c, newCourse));
  if (verySimilar) {
    return {
      proceed: "CONFIRM",
      type: "VERY_SIMILAR",
      existingCourse: verySimilar,
      message: "매우 유사한 코스가 있습니다",
    };
  }

  // 3. 단순 유사 (시작/끝만 같음)
  const similar = existingCourses.filter((c) => isSameStartEnd(c, newCourse));
  if (similar.length > 0) {
    return {
      proceed: "CONFIRM",
      type: "SIMILAR",
      existingCourses: similar,
      message: "동일 구간 코스가 발견되었습니다",
    };
  }

  return { proceed: true };
}
