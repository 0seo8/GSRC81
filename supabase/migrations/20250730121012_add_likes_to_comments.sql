-- Add likes_count column to course_comments table
ALTER TABLE course_comments 
ADD COLUMN likes_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for better performance on likes_count queries
CREATE INDEX idx_course_comments_likes_count ON course_comments(likes_count DESC);