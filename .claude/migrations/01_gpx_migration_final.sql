-- GSRC81 Maps: GPX 데이터 통합 마이그레이션 (최종 버전)
-- Version: 1.2
-- Description: course_points 데이터를 JSONB로 통합

-- ========================================
-- Step 1: gpx_data 컬럼 추가
-- ========================================
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS gpx_data JSONB;

-- ========================================
-- Step 2: course_points 데이터를 gpx_data로 마이그레이션
-- ========================================
UPDATE courses c
SET gpx_data = jsonb_build_object(
    'version', '1.1',
    'points', COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'lat', cp.latitude,
                    'lng', cp.longitude,
                    'ele', cp.elevation
                ) ORDER BY cp.seq
            )
            FROM course_points cp
            WHERE cp.course_id = c.id
        ),
        '[]'::jsonb
    ),
    'bounds', jsonb_build_object(
        'minLat', (
            SELECT MIN(latitude) 
            FROM course_points 
            WHERE course_id = c.id
        ),
        'maxLat', (
            SELECT MAX(latitude)
            FROM course_points
            WHERE course_id = c.id
        ),
        'minLng', (
            SELECT MIN(longitude)
            FROM course_points
            WHERE course_id = c.id
        ),
        'maxLng', (
            SELECT MAX(longitude)
            FROM course_points
            WHERE course_id = c.id
        )
    ),
    'stats', jsonb_build_object(
        'totalDistance', c.distance_km,
        'elevationGain', COALESCE(c.elevation_gain, 0),
        'estimatedDuration', c.avg_time_min
    ),
    'metadata', jsonb_build_object(
        'startPoint', jsonb_build_object(
            'lat', c.start_latitude,
            'lng', c.start_longitude
        ),
        'endPoint', CASE 
            WHEN c.end_latitude IS NOT NULL AND c.end_longitude IS NOT NULL
            THEN jsonb_build_object(
                'lat', c.end_latitude,
                'lng', c.end_longitude
            )
            ELSE NULL
        END,
        'nearestStation', c.nearest_station,
        'gpxUrl', c.gpx_url
    )
)
WHERE c.gpx_data IS NULL
AND EXISTS (
    SELECT 1 FROM course_points WHERE course_id = c.id
);

-- ========================================
-- Step 3: gpx_coordinates가 비어있지만 시작/종료 좌표가 있는 경우 처리
-- ========================================
UPDATE courses c
SET gpx_data = jsonb_build_object(
    'version', '1.1',
    'points', '[]'::jsonb, -- 빈 배열
    'bounds', jsonb_build_object(
        'minLat', LEAST(c.start_latitude, COALESCE(c.end_latitude, c.start_latitude)),
        'maxLat', GREATEST(c.start_latitude, COALESCE(c.end_latitude, c.start_latitude)),
        'minLng', LEAST(c.start_longitude, COALESCE(c.end_longitude, c.start_longitude)),
        'maxLng', GREATEST(c.start_longitude, COALESCE(c.end_longitude, c.start_longitude))
    ),
    'stats', jsonb_build_object(
        'totalDistance', c.distance_km,
        'elevationGain', COALESCE(c.elevation_gain, 0),
        'estimatedDuration', c.avg_time_min
    ),
    'metadata', jsonb_build_object(
        'startPoint', jsonb_build_object(
            'lat', c.start_latitude,
            'lng', c.start_longitude
        ),
        'endPoint', CASE 
            WHEN c.end_latitude IS NOT NULL AND c.end_longitude IS NOT NULL
            THEN jsonb_build_object(
                'lat', c.end_latitude,
                'lng', c.end_longitude
            )
            ELSE NULL
        END,
        'nearestStation', c.nearest_station,
        'gpxUrl', c.gpx_url
    )
)
WHERE c.gpx_data IS NULL
AND NOT EXISTS (
    SELECT 1 FROM course_points WHERE course_id = c.id
);

-- ========================================
-- Step 4: 인덱스 생성 (성능 최적화)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_courses_gpx_data ON courses USING GIN (gpx_data);
CREATE INDEX IF NOT EXISTS idx_courses_gpx_data_points ON courses USING GIN ((gpx_data -> 'points'));
CREATE INDEX IF NOT EXISTS idx_courses_gpx_data_stats ON courses USING GIN ((gpx_data -> 'stats'));

-- ========================================
-- Step 5: 뷰 생성 (하위 호환성)
-- ========================================
CREATE OR REPLACE VIEW courses_legacy_view AS
SELECT 
    id,
    title,
    description,
    gpx_url,
    -- 기존 컬럼들 유지
    (gpx_data->'metadata'->'startPoint'->>'lat')::numeric AS start_latitude,
    (gpx_data->'metadata'->'startPoint'->>'lng')::numeric AS start_longitude,
    (gpx_data->'metadata'->'endPoint'->>'lat')::numeric AS end_latitude,
    (gpx_data->'metadata'->'endPoint'->>'lng')::numeric AS end_longitude,
    (gpx_data->'stats'->>'totalDistance')::numeric AS distance_km,
    (gpx_data->'stats'->>'estimatedDuration')::integer AS avg_time_min,
    (gpx_data->'stats'->>'elevationGain')::numeric AS elevation_gain,
    difficulty,
    gpx_data->'metadata'->>'nearestStation' AS nearest_station,
    is_active,
    created_at,
    -- 새로운 통합 데이터
    gpx_data,
    -- 하위 호환성을 위한 gpx_coordinates (points 배열을 JSON 문자열로)
    CASE 
        WHEN jsonb_array_length(gpx_data->'points') > 0 
        THEN (gpx_data->'points')::text 
        ELSE NULL 
    END AS gpx_coordinates
FROM courses
WHERE gpx_data IS NOT NULL;

-- ========================================
-- Step 6: 검증 함수 생성
-- ========================================
CREATE OR REPLACE FUNCTION validate_gpx_data(gpx_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- 버전 체크
    IF NOT (gpx_data ? 'version' AND gpx_data->>'version' IN ('1.0', '1.1')) THEN
        RETURN FALSE;
    END IF;
    
    -- 필수 필드 체크
    IF NOT (gpx_data ? 'points' AND gpx_data ? 'stats') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Step 7: 트리거 생성 - GPX 데이터 자동 검증
-- ========================================
CREATE OR REPLACE FUNCTION trigger_validate_gpx_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gpx_data IS NOT NULL AND NOT validate_gpx_data(NEW.gpx_data) THEN
        RAISE EXCEPTION 'Invalid GPX data format';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_gpx_data_before_insert_update
    BEFORE INSERT OR UPDATE ON courses
    FOR EACH ROW
    WHEN (NEW.gpx_data IS NOT NULL)
    EXECUTE FUNCTION trigger_validate_gpx_data();

-- ========================================
-- Step 8: 통계 뷰 생성
-- ========================================
CREATE OR REPLACE VIEW course_statistics AS
SELECT 
    id,
    title,
    (gpx_data->'stats'->>'totalDistance')::numeric AS distance_km,
    (gpx_data->'stats'->>'elevationGain')::numeric AS elevation_gain,
    (gpx_data->'stats'->>'estimatedDuration')::integer AS duration_min,
    jsonb_array_length(gpx_data->'points') AS point_count,
    difficulty,
    created_at
FROM courses
WHERE gpx_data IS NOT NULL
AND is_active = true
ORDER BY created_at DESC;

-- ========================================
-- Step 9: 마이그레이션 결과 확인
-- ========================================
SELECT 
    'Migration Summary' AS info,
    COUNT(*) AS total_courses,
    COUNT(gpx_data) AS migrated_courses,
    COUNT(CASE WHEN jsonb_array_length(gpx_data->'points') > 0 THEN 1 END) AS courses_with_points,
    SUM(jsonb_array_length(gpx_data->'points')) AS total_points
FROM courses;

-- ========================================
-- Step 10: 성공 메시지
-- ========================================
DO $$
DECLARE
    v_total_courses INTEGER;
    v_migrated_courses INTEGER;
    v_total_points INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(gpx_data),
        COALESCE(SUM(jsonb_array_length(gpx_data->'points')), 0)
    INTO v_total_courses, v_migrated_courses, v_total_points
    FROM courses;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'GPX 데이터 마이그레이션 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '전체 코스: % 개', v_total_courses;
    RAISE NOTICE '마이그레이션 완료: % 개', v_migrated_courses;
    RAISE NOTICE '총 GPX 포인트: % 개', v_total_points;
    RAISE NOTICE '';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '1. 애플리케이션 코드에서 gpx_data 컬럼 사용';
    RAISE NOTICE '2. course_points 테이블은 백업용으로 유지';
    RAISE NOTICE '3. gpx_coordinates 컬럼은 deprecated';
END $$;