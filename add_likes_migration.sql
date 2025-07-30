-- GSRC81 Maps - 좋아요 기능 추가 마이그레이션
-- course_comments 테이블에 likes_count 컬럼 추가

-- 1. likes_count 컬럼 추가 (기본값 0)
ALTER TABLE course_comments 
ADD COLUMN likes_count INTEGER DEFAULT 0 NOT NULL;

-- 2. 성능을 위한 인덱스 추가
CREATE INDEX idx_course_comments_likes_count ON course_comments(likes_count DESC);

-- 3. 기존 데이터의 likes_count를 0으로 설정 (이미 기본값이 0이므로 선택사항)
UPDATE course_comments SET likes_count = 0 WHERE likes_count IS NULL;

-- 4. 검증: 테이블 구조 확인
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'course_comments' 
-- ORDER BY ordinal_position;