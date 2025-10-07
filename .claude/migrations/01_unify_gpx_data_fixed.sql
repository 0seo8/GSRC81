-- GSRC81 Maps: GPX 데이터 통합 마이그레이션 (수정 버전)
-- Version: 1.1
-- Description: GPX 데이터를 JSONB 단일 컬럼으로 통합

-- Step 1: courses 테이블에 새 컬럼 추가
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS gpx_data JSONB;

-- Step 2: 기존 데이터를 새 형식으로 마이그레이션
UPDATE courses c
SET gpx_data = jsonb_build_object(
    'version', '1.1',
    'points', COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'lat', cp.latitude,
                    'lng', cp.longitude,
                    'ele', cp.elevation,
                    'dist', NULL
                ) ORDER BY cp.seq
            )
            FROM course_points cp
            WHERE cp.course_id = c.id
        ),
        CASE 
            WHEN c.gpx_coordinates IS NOT NULL 
            THEN c.gpx_coordinates::jsonb
            ELSE '[]'::jsonb
        END
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

-- Step 3: gpx_coordinates 문자열 데이터가 있는 경우 처리
UPDATE courses
SET gpx_data = jsonb_build_object(
    'version', '1.1',
    'points', 
        CASE 
            WHEN gpx_coordinates::jsonb IS NOT NULL 
            THEN gpx_coordinates::jsonb
            ELSE '[]'::jsonb
        END,
    'bounds', jsonb_build_object(
        'minLat', start_latitude - 0.01,
        'maxLat', COALESCE(end_latitude, start_latitude) + 0.01,
        'minLng', start_longitude - 0.01,
        'maxLng', COALESCE(end_longitude, start_longitude) + 0.01
    ),
    'stats', jsonb_build_object(
        'totalDistance', distance_km,
        'elevationGain', COALESCE(elevation_gain, 0),
        'estimatedDuration', avg_time_min
    ),
    'metadata', jsonb_build_object(
        'startPoint', jsonb_build_object(
            'lat', start_latitude,
            'lng', start_longitude
        ),
        'endPoint', CASE 
            WHEN end_latitude IS NOT NULL AND end_longitude IS NOT NULL
            THEN jsonb_build_object(
                'lat', end_latitude,
                'lng', end_longitude
            )
            ELSE NULL
        END,
        'nearestStation', nearest_station,
        'gpxUrl', gpx_url
    )
)
WHERE gpx_data IS NULL
AND gpx_coordinates IS NOT NULL
AND gpx_coordinates != '';

-- Step 4: 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_courses_gpx_data ON courses USING GIN (gpx_data);
CREATE INDEX IF NOT EXISTS idx_courses_gpx_data_points ON courses USING GIN ((gpx_data -> 'points'));
CREATE INDEX IF NOT EXISTS idx_courses_gpx_data_stats ON courses USING GIN ((gpx_data -> 'stats'));

-- Step 5: 뷰 생성 (하위 호환성) - 실제 존재하는 컬럼만 사용
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
    -- 하위 호환성을 위한 gpx_coordinates (deprecated)
    (gpx_data->'points')::text AS gpx_coordinates
FROM courses;

-- Step 6: 함수 생성 - GPX 데이터 검증
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
    
    -- points 배열 체크
    IF jsonb_array_length(gpx_data->'points') < 2 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 7: 트리거 생성 - GPX 데이터 자동 검증
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

-- Step 8: 통계 뷰 생성
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

-- Step 9: 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GPX 데이터 통합 마이그레이션 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. gpx_data JSONB 컬럼 추가됨';
    RAISE NOTICE '2. 기존 데이터 마이그레이션 완료';
    RAISE NOTICE '3. courses_legacy_view 생성됨 (하위 호환성)';
    RAISE NOTICE '4. 인덱스 및 검증 트리거 추가됨';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  주의사항:';
    RAISE NOTICE '- 애플리케이션 코드 업데이트 필요';
    RAISE NOTICE '- course_points 테이블은 아직 유지됨';
    RAISE NOTICE '- gpx_coordinates 컬럼은 deprecated';
END $$;