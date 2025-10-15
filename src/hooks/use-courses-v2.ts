// GSRC81 Maps: 코스 데이터 훅 (v2 - gpx_data_v2 사용)
import { useState, useEffect, useCallback } from 'react';
import { CourseV2 } from '@/types/unified';
import { 
  getActiveCoursesV2, 
  getCourseByIdV2,
  subscribeToCourseChanges 
} from '@/lib/courses-data-v2';

/**
 * 모든 코스 가져오기 훅
 */
export function useCoursesV2() {
  const [courses, setCourses] = useState<CourseV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveCoursesV2();
      setCourses(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();

    // 실시간 구독
    const subscription = subscribeToCourseChanges((course) => {
      setCourses(prev => {
        const index = prev.findIndex(c => c.id === course.id);
        if (index >= 0) {
          // 업데이트
          const updated = [...prev];
          updated[index] = course;
          return updated;
        } else {
          // 새로운 코스
          return [...prev, course];
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

/**
 * 단일 코스 가져오기 훅
 */
export function useCourseV2(courseId: string) {
  const [course, setCourse] = useState<CourseV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await getCourseByIdV2(courseId);
        setCourse(data);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  return { course, loading, error };
}

/**
 * 코스 필터링 훅
 */
export function useFilteredCoursesV2(
  filters: {
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: 'track' | 'trail' | 'road';
    minDistance?: number;
    maxDistance?: number;
  } = {}
) {
  const { courses, loading, error } = useCoursesV2();
  const [filteredCourses, setFilteredCourses] = useState<CourseV2[]>([]);

  useEffect(() => {
    let filtered = [...courses];

    // 난이도 필터
    if (filters.difficulty) {
      filtered = filtered.filter(c => c.difficulty === filters.difficulty);
    }

    // 타입 필터
    if (filters.type) {
      filtered = filtered.filter(c => c.course_type === filters.type);
    }

    // 거리 필터
    if (filters.minDistance !== undefined || filters.maxDistance !== undefined) {
      filtered = filtered.filter(c => {
        const distance = c.gpx_data_v2.stats.totalDistance;
        const minOk = filters.minDistance === undefined || distance >= filters.minDistance;
        const maxOk = filters.maxDistance === undefined || distance <= filters.maxDistance;
        return minOk && maxOk;
      });
    }

    setFilteredCourses(filtered);
  }, [courses, filters]);

  return { courses: filteredCourses, loading, error };
}

/**
 * 코스 통계 훅
 */
export function useCourseStatsV2() {
  const { courses } = useCoursesV2();
  
  const stats = {
    totalCourses: courses.length,
    totalDistance: courses.reduce((sum, c) => sum + c.gpx_data_v2.stats.totalDistance, 0),
    totalPoints: courses.reduce((sum, c) => sum + c.gpx_data_v2.points.length, 0),
    byDifficulty: {
      easy: courses.filter(c => c.difficulty === 'easy').length,
      medium: courses.filter(c => c.difficulty === 'medium').length,
      hard: courses.filter(c => c.difficulty === 'hard').length
    },
    byType: {
      track: courses.filter(c => c.course_type === 'track').length,
      trail: courses.filter(c => c.course_type === 'trail').length,
      road: courses.filter(c => c.course_type === 'road').length
    },
    averageDistance: courses.length > 0 
      ? courses.reduce((sum, c) => sum + c.gpx_data_v2.stats.totalDistance, 0) / courses.length
      : 0,
    averageElevation: courses.length > 0
      ? courses.reduce((sum, c) => sum + c.gpx_data_v2.stats.elevationGain, 0) / courses.length
      : 0
  };

  return stats;
}