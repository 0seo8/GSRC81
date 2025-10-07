-- GSRC81 Maps: 테이블 구조 확인 (단계별 실행)
-- 각 쿼리를 개별적으로 실행하세요!

-- ========================================
-- STEP 1: courses 테이블 컬럼 확인
-- ========================================
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

-- ========================================
-- STEP 2: course_points 테이블 존재 여부
-- ========================================
SELECT 
    EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'course_points'
    ) AS course_points_exists;

-- ========================================
-- STEP 3: 모든 테이블 목록 확인
-- ========================================
SELECT 
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;

-- ========================================
-- STEP 4: courses 테이블 첫 번째 행 구조 확인
-- ========================================
SELECT * FROM courses LIMIT 1;

-- ========================================
-- STEP 5: 현재 데이터 통계 (gpx_data 제외)
-- ========================================
SELECT 
    COUNT(*) AS total_courses,
    COUNT(gpx_coordinates) AS has_gpx_coordinates,
    COUNT(CASE WHEN gpx_coordinates IS NOT NULL AND gpx_coordinates != '' THEN 1 END) AS valid_gpx_coordinates,
    COUNT(start_latitude) AS has_start_coords,
    COUNT(end_latitude) AS has_end_coords,
    COUNT(elevation_gain) AS has_elevation_gain
FROM courses;

-- ========================================
-- STEP 6: gpx_coordinates 샘플 데이터 확인
-- ========================================
SELECT 
    id,
    title,
    LENGTH(gpx_coordinates) AS coord_length,
    LEFT(gpx_coordinates, 100) AS coord_preview
FROM courses
WHERE gpx_coordinates IS NOT NULL 
AND gpx_coordinates != ''
LIMIT 3;

-- ========================================
-- STEP 7: course_points 테이블 구조 (있는 경우)
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'course_points'
ORDER BY 
    ordinal_position;

-- ========================================
-- STEP 8: course_points 데이터 샘플 (있는 경우)
-- ========================================
SELECT 
    course_id,
    COUNT(*) AS point_count,
    MIN(seq) AS min_seq,
    MAX(seq) AS max_seq
FROM course_points
GROUP BY course_id
LIMIT 5;