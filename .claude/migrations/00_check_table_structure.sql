-- GSRC81 Maps: 테이블 구조 확인 스크립트
-- 마이그레이션 전에 먼저 실행하세요!

-- 1. courses 테이블 컬럼 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'courses'
ORDER BY 
    ordinal_position;

-- 2. course_points 테이블 존재 여부 확인
SELECT 
    EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'course_points'
    ) AS course_points_exists;

-- 3. courses 테이블 샘플 데이터 확인 (1개만)
SELECT * FROM courses LIMIT 1;

-- 4. gpx_coordinates 컬럼 데이터 타입 확인
SELECT 
    pg_typeof(gpx_coordinates) AS gpx_coordinates_type,
    gpx_coordinates IS NOT NULL AS has_data,
    LENGTH(gpx_coordinates::text) AS data_length
FROM courses
WHERE gpx_coordinates IS NOT NULL
LIMIT 1;

-- 5. 테이블 통계 확인
SELECT 
    COUNT(*) AS total_courses,
    COUNT(gpx_coordinates) AS has_gpx_coordinates,
    COUNT(gpx_data) AS has_gpx_data,
    COUNT(CASE WHEN gpx_coordinates IS NOT NULL AND gpx_coordinates != '' THEN 1 END) AS valid_gpx_coordinates
FROM courses;

-- 6. course_points 테이블이 있다면 데이터 확인
SELECT 
    course_id,
    COUNT(*) AS point_count
FROM course_points
GROUP BY course_id
LIMIT 5;