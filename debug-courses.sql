-- 등록된 코스 확인
SELECT 
    id, 
    title, 
    category_id,
    is_active,
    created_at
FROM courses 
ORDER BY created_at DESC 
LIMIT 10;

-- 카테고리 확인  
SELECT 
    id,
    key,
    name,
    is_active
FROM course_categories
WHERE is_active = true;