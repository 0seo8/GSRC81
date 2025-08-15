-- 시작점과 종료점 데이터 확인
SELECT 
    id,
    title,
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    -- 시작점과 종료점 간의 거리 계산 (대략적)
    ROUND(
        CAST(
            6371 * acos(
                cos(radians(start_latitude)) * 
                cos(radians(end_latitude)) * 
                cos(radians(end_longitude) - radians(start_longitude)) + 
                sin(radians(start_latitude)) * 
                sin(radians(end_latitude))
            ) * 1000 AS NUMERIC
        ), 2
    ) as distance_meters,
    CASE 
        WHEN start_latitude = end_latitude AND start_longitude = end_longitude 
        THEN 'SAME_POINT'
        WHEN ABS(start_latitude - end_latitude) < 0.0001 AND ABS(start_longitude - end_longitude) < 0.0001
        THEN 'VERY_CLOSE'
        ELSE 'DIFFERENT'
    END as point_comparison
FROM courses 
WHERE is_active = true
ORDER BY created_at DESC;