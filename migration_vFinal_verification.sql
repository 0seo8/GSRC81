-- GSRC81 MAPS vFinal Migration 검증 쿼리
-- 실행 위치: Supabase SQL Editor

-- 1. GPX 데이터 구조 검증
SELECT 
  id,
  title,
  jsonb_typeof(gpx_data->'points') AS points_type,
  jsonb_array_length(gpx_data->'points') AS point_count,
  (gpx_data->'stats'->>'totalDistance')::numeric AS total_distance,
  (gpx_data->'bounds') IS NOT NULL AS has_bounds,
  (gpx_data->'version') IS NULL AS is_vfinal_structure,
  created_at
FROM public.courses 
WHERE gpx_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. 정상 결과 예시:
-- | id | title | points_type | point_count | total_distance | has_bounds | is_vfinal_structure |
-- |----|-------|-------------|-------------|----------------|------------|---------------------|
-- | xx | 불광천   | array       | 3420        | 5.23           | true       | true                |

-- 3. 모든 코스의 GPX 데이터 요약
SELECT 
  COUNT(*) AS total_courses,
  COUNT(CASE WHEN gpx_data IS NOT NULL THEN 1 END) AS courses_with_gpx,
  COUNT(CASE WHEN gpx_data->'version' IS NOT NULL THEN 1 END) AS legacy_structure_count,
  COUNT(CASE WHEN gpx_data->'version' IS NULL AND gpx_data->'points' IS NOT NULL THEN 1 END) AS vfinal_structure_count
FROM public.courses;

-- 4. 문제가 있는 코스 찾기
SELECT 
  id, 
  title,
  'Missing points array' AS issue
FROM public.courses 
WHERE gpx_data IS NOT NULL 
  AND (gpx_data->'points' IS NULL OR jsonb_typeof(gpx_data->'points') != 'array')

UNION ALL

SELECT 
  id, 
  title,
  'Missing stats' AS issue  
FROM public.courses
WHERE gpx_data IS NOT NULL 
  AND gpx_data->'stats' IS NULL

UNION ALL

SELECT 
  id, 
  title,
  'Missing bounds' AS issue
FROM public.courses 
WHERE gpx_data IS NOT NULL 
  AND gpx_data->'bounds' IS NULL;