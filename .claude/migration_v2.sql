-- GSRC81 Maps Database Migration Script v2
-- Based on PRD 2025 Q4 Specification
-- Date: 2025-01-06

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- ============================================
-- 2. BACKUP EXISTING DATA
-- ============================================
-- Create backup tables before migration
CREATE TABLE IF NOT EXISTS courses_backup AS SELECT * FROM courses WHERE false;
INSERT INTO courses_backup SELECT * FROM courses;

CREATE TABLE IF NOT EXISTS course_points_backup AS SELECT * FROM course_points WHERE false;
INSERT INTO course_points_backup SELECT * FROM course_points;

CREATE TABLE IF NOT EXISTS course_comments_backup AS SELECT * FROM course_comments WHERE false;
INSERT INTO course_comments_backup SELECT * FROM course_comments;

-- ============================================
-- 3. CREATE NEW TABLES
-- ============================================

-- Users table (for Kakao login support)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) DEFAULT 'kakao',
  provider_id VARCHAR(200) UNIQUE,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(200),
  profile_image TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main courses table with JSONB structure
CREATE TABLE IF NOT EXISTS courses_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  
  -- JSONB for all GPX data (v1.1 structure)
  gpx_data JSONB NOT NULL CHECK (
    gpx_data ? 'version' AND 
    gpx_data ? 'points' AND 
    gpx_data ? 'bounds' AND 
    gpx_data ? 'stats'
  ),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Generated columns for indexing and quick access
  distance_km DECIMAL(6,3) GENERATED ALWAYS AS 
    (ROUND((gpx_data->'stats'->>'totalDistance')::DECIMAL, 3)) STORED,
  
  elevation_gain DECIMAL(6,2) GENERATED ALWAYS AS 
    (ROUND((gpx_data->'stats'->>'elevationGain')::DECIMAL, 2)) STORED,
  
  duration_min INT GENERATED ALWAYS AS 
    ((gpx_data->'stats'->>'estimatedDuration')::INT) STORED,
  
  -- Bounds for map queries
  bounds_min_lat DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'minLat')::DECIMAL) STORED,
  bounds_max_lat DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'maxLat')::DECIMAL) STORED,
  bounds_min_lng DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'minLng')::DECIMAL) STORED,
  bounds_max_lng DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'maxLng')::DECIMAL) STORED
);

-- Waypoint comments table
CREATE TABLE IF NOT EXISTS course_comments_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses_v2(id) ON DELETE CASCADE,
  
  -- Point location
  point_index INT NOT NULL, -- Index in points array
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  
  -- Comment data
  user_id UUID REFERENCES users(id),
  username VARCHAR(100) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  
  -- Metadata
  is_admin_comment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course likes/bookmarks (optional, for future)
CREATE TABLE IF NOT EXISTS course_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

-- GIN index for JSONB queries
CREATE INDEX idx_courses_gpx_data ON courses_v2 USING GIN (gpx_data jsonb_path_ops);

-- Standard indexes for queries
CREATE INDEX idx_courses_active ON courses_v2(is_active);
CREATE INDEX idx_courses_difficulty ON courses_v2(difficulty);
CREATE INDEX idx_courses_distance ON courses_v2(distance_km);
CREATE INDEX idx_courses_created ON courses_v2(created_at DESC);

-- Spatial-like indexes for bounds
CREATE INDEX idx_courses_bounds ON courses_v2(
  bounds_min_lat, bounds_max_lat, bounds_min_lng, bounds_max_lng
);

-- Comments indexes
CREATE INDEX idx_comments_course ON course_comments_v2(course_id);
CREATE INDEX idx_comments_point ON course_comments_v2(course_id, point_index);
CREATE INDEX idx_comments_user ON course_comments_v2(user_id);
CREATE INDEX idx_comments_created ON course_comments_v2(created_at DESC);

-- User indexes
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 5. DATA MIGRATION SCRIPT
-- ============================================

-- Migrate existing courses to courses_v2
INSERT INTO courses_v2 (
  id, 
  title, 
  description, 
  difficulty,
  gpx_data,
  is_active,
  created_at
)
SELECT 
  c.id,
  c.title,
  c.description,
  c.difficulty,
  jsonb_build_object(
    'version', '1.1',
    'points', COALESCE(
      -- Try to get points from course_points table first
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
      -- Fallback to gpx_coordinates if no course_points
      CASE 
        WHEN c.gpx_coordinates IS NOT NULL AND c.gpx_coordinates != '' 
        THEN c.gpx_coordinates::jsonb
        ELSE jsonb_build_array(
          jsonb_build_object(
            'lat', c.start_latitude,
            'lng', c.start_longitude,
            'ele', 0
          )
        )
      END
    ),
    'bounds', jsonb_build_object(
      'minLat', LEAST(c.start_latitude, COALESCE(c.end_latitude, c.start_latitude)),
      'maxLat', GREATEST(c.start_latitude, COALESCE(c.end_latitude, c.start_latitude)),
      'minLng', LEAST(c.start_longitude, COALESCE(c.end_longitude, c.start_longitude)),
      'maxLng', GREATEST(c.start_longitude, COALESCE(c.end_longitude, c.start_longitude))
    ),
    'stats', jsonb_build_object(
      'totalDistance', COALESCE(c.distance_km, 0),
      'elevationGain', COALESCE(c.elevation_gain, 0),
      'elevationLoss', COALESCE(c.elevation_gain * 0.8, 0),
      'estimatedDuration', COALESCE(c.avg_time_min, 30),
      'maxElevation', 0,
      'minElevation', 0
    ),
    'metadata', jsonb_build_object(
      'originalFileName', NULL,
      'uploadedAt', c.created_at,
      'processedAt', NOW()
    )
  ),
  c.is_active,
  c.created_at
FROM courses c
ON CONFLICT (id) DO NOTHING;

-- Migrate existing comments
INSERT INTO course_comments_v2 (
  course_id,
  point_index,
  lat,
  lng,
  username,
  content,
  is_active,
  created_at
)
SELECT 
  cc.course_id,
  0, -- Default to first point since old comments don't have waypoint info
  c.start_latitude,
  c.start_longitude,
  cc.author_nickname,
  cc.message,
  cc.is_active,
  cc.created_at
FROM course_comments cc
JOIN courses c ON c.id = cc.course_id
WHERE EXISTS (SELECT 1 FROM courses_v2 WHERE id = cc.course_id)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. CREATE FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON course_comments_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE courses_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_likes ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Courses are viewable by everyone" 
  ON courses_v2 FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Courses are insertable by admins" 
  ON courses_v2 FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Courses are updatable by admins" 
  ON courses_v2 FOR UPDATE 
  USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Courses are deletable by admins" 
  ON courses_v2 FOR DELETE 
  USING (auth.jwt() ->> 'is_admin' = 'true');

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" 
  ON course_comments_v2 FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Comments are insertable by authenticated users" 
  ON course_comments_v2 FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Comments are updatable by owner or admin" 
  ON course_comments_v2 FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'is_admin' = 'true'
  );

CREATE POLICY "Comments are deletable by owner or admin" 
  ON course_comments_v2 FOR DELETE 
  USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'is_admin' = 'true'
  );

-- Users policies
CREATE POLICY "Users are viewable by everyone" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" 
  ON course_likes FOR SELECT 
  USING (true);

CREATE POLICY "Users can like courses" 
  ON course_likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike courses" 
  ON course_likes FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to get course with comment count
CREATE OR REPLACE FUNCTION get_course_with_stats(course_uuid UUID)
RETURNS TABLE(
  course JSONB,
  comment_count BIGINT,
  like_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(c.*)::jsonb as course,
    COUNT(DISTINCT cc.id) as comment_count,
    COUNT(DISTINCT cl.id) as like_count
  FROM courses_v2 c
  LEFT JOIN course_comments_v2 cc ON cc.course_id = c.id AND cc.is_active = true
  LEFT JOIN course_likes cl ON cl.course_id = c.id
  WHERE c.id = course_uuid
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby courses
CREATE OR REPLACE FUNCTION get_nearby_courses(
  lat DECIMAL, 
  lng DECIMAL, 
  radius_km DECIMAL DEFAULT 5
)
RETURNS SETOF courses_v2 AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM courses_v2
  WHERE is_active = true
    AND (
      -- Simple bounding box check (approximate)
      bounds_min_lat <= lat + (radius_km / 111.0) AND
      bounds_max_lat >= lat - (radius_km / 111.0) AND
      bounds_min_lng <= lng + (radius_km / (111.0 * COS(RADIANS(lat)))) AND
      bounds_max_lng >= lng - (radius_km / (111.0 * COS(RADIANS(lat))))
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. SAMPLE DATA (Optional)
-- ============================================

-- Insert sample admin user
INSERT INTO users (id, provider, username, email, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system',
  'admin',
  'admin@gsrc81.com',
  true
) ON CONFLICT DO NOTHING;

-- ============================================
-- 10. VERIFICATION QUERIES
-- ============================================

-- Check migration status
DO $$
BEGIN
  RAISE NOTICE 'Migration Status Report:';
  RAISE NOTICE '========================';
  
  -- Count records
  RAISE NOTICE 'Original courses: %', (SELECT COUNT(*) FROM courses);
  RAISE NOTICE 'Migrated courses_v2: %', (SELECT COUNT(*) FROM courses_v2);
  RAISE NOTICE 'Original comments: %', (SELECT COUNT(*) FROM course_comments);
  RAISE NOTICE 'Migrated comments_v2: %', (SELECT COUNT(*) FROM course_comments_v2);
  
  -- Verify JSONB structure
  RAISE NOTICE 'Courses with valid JSONB: %', (
    SELECT COUNT(*) FROM courses_v2 
    WHERE gpx_data ? 'version' 
      AND gpx_data ? 'points' 
      AND gpx_data ? 'bounds' 
      AND gpx_data ? 'stats'
  );
END $$;

-- ============================================
-- 11. ROLLBACK SCRIPT (Keep for safety)
-- ============================================

/*
-- TO ROLLBACK:
DROP TABLE IF EXISTS course_likes CASCADE;
DROP TABLE IF EXISTS course_comments_v2 CASCADE;
DROP TABLE IF EXISTS courses_v2 CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Restore from backup
CREATE TABLE courses AS SELECT * FROM courses_backup;
CREATE TABLE course_points AS SELECT * FROM course_points_backup;
CREATE TABLE course_comments AS SELECT * FROM course_comments_backup;

-- Re-create original indexes...
*/

-- ============================================
-- END OF MIGRATION SCRIPT
-- ============================================