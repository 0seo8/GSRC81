-- GSRC81 Maps Database Schema for Supabase
-- 은평구 기반 러닝코스 지도 서비스

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 관리자 테이블
CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 앱 접근 링크/비밀번호 관리 테이블
CREATE TABLE access_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_code VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 러닝 코스 테이블 (PostGIS 없이 기본 좌표 사용)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- GPX 관련 데이터
    gpx_url VARCHAR(500), -- Supabase Storage URL
    gpx_data TEXT, -- GPX 파일 원본 데이터 (백업용)
    
    -- 위치 정보 (기본 decimal 타입)
    start_latitude DECIMAL(10,8) NOT NULL, -- 시작점 위도
    start_longitude DECIMAL(11,8) NOT NULL, -- 시작점 경도
    finish_latitude DECIMAL(10,8), -- 종료점 위도
    finish_longitude DECIMAL(11,8), -- 종료점 경도
    
    -- 코스 정보
    distance_km DECIMAL(5,2) NOT NULL, -- 거리 (km)
    avg_time_min INTEGER, -- 평균 소요시간 (분)
    altitude_gain INTEGER, -- 고도차 (m)
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    
    -- 추가 정보
    nearest_station VARCHAR(100), -- 가장 가까운 지하철역
    cover_image_url VARCHAR(500), -- 대표 이미지
    landmarks TEXT[], -- 주요 랜드마크 배열
    
    -- 메타데이터
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 코스 댓글/말풍선 테이블 (지도상 위치 제거, 하단 피드용)
CREATE TABLE course_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_nickname VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    
    -- 댓글 메타데이터
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 사용자 프로필 (옵션, 익명 기반이면 생략 가능)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 앱 설정 테이블 (추후 확장용)
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_distance ON courses(distance_km);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_course_comments_course_id ON course_comments(course_id);
CREATE INDEX idx_course_comments_created_at ON course_comments(created_at DESC);
CREATE INDEX idx_access_links_active ON access_links(is_active);

-- 트리거 함수: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_links_updated_at BEFORE UPDATE ON access_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초기 데이터 삽입
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('app_name', '"GSRC81 Maps"', '앱 이름'),
('app_version', '"1.0.0"', '앱 버전'),
('default_map_center', '{"lat": 37.6176, "lng": 126.9227}', '기본 지도 중심점 (은평구)'),
('default_map_zoom', '13', '기본 지도 줌 레벨'),
('mascot_animation_speed', '2000', '마스코트 애니메이션 속도 (ms)'),
('comment_max_length', '200', '댓글 최대 길이');

-- 기본 관리자 계정 (비밀번호: admin123, 실제 운영시 변경 필요)
INSERT INTO admin (username, password_hash) VALUES
('admin', '$2b$10$rOCNrH2OH5YmEIWV7JtBk.FX3Ul4nxj6YOKJhpjQO7AHrg6/Y3qSu');

-- 기본 접근 링크 (비밀번호: gsrc81, 실제 운영시 변경 필요)
INSERT INTO access_links (access_code, password_hash) VALUES
('gsrc81-maps-2024', '$2b$10$rOCNrH2OH5YmEIWV7JtBk.FX3Ul4nxj6YOKJhpjQO7AHrg6/Y3qSu');