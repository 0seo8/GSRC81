# GSRC81 Maps 통합 페이지 기획서 v2.0

## 📋 문서 개요

본 문서는 기존 `PAGE_SPECIFICATIONS.md`와 `prd.md`의 불일치를 해결하고, 누락된 상세 명세를 보강한 **최종 통합 기획서**입니다.

**기준**: PRD 2025 Q4 + Migration Strategy + 실제 구현 요구사항

---

## 🔄 기존 기획서 불일치 해결

### 1. **비행모드 상세 기능 통합**

#### 🛰️ Flight Mode 완전 명세
```typescript
interface FlightModeState {
  isActive: boolean;         // 비행모드 활성화
  isPaused: boolean;         // 일시정지 상태
  speed: number;             // 재생 속도 (0.5x, 1x, 2x, 3x)
  progress: number;          // 진행률 (0-100%)
  currentPointIndex: number; // 현재 포인트 인덱스
  
  // ✨ PRD 2025 Q4 추가 명세
  cameraTracking: {
    enabled: boolean;        // 카메라 자동 추적
    followDistance: number;  // 추적 거리 (미터)
    tilt: number;           // 카메라 기울기 (0-60도)
    bearing: number;        // 카메라 방향 (자동 계산)
  };
  
  // 🎮 고급 컨트롤
  playbackOptions: {
    autoStart: boolean;      // 페이지 로드 시 자동 시작
    loopMode: boolean;       // 반복 재생
    showTrail: boolean;      // 지나온 경로 표시
    showKmMarkers: boolean;  // km 단위 마커 표시
  };
}
```

#### 🎮 비행모드 UI 컨트롤 상세
```typescript
// 하단 고정 컨트롤 바
interface FlightControlsProps {
  flightMode: FlightModeState;
  onToggleFlightMode: () => void;
  onPauseResume: () => void;
  onSpeedChange: (speed: number) => void;
  onProgressSeek: (progress: number) => void;  // 진행률 바 클릭
  onReset: () => void;
  onCameraToggle: () => void;                  // 카메라 추적 토글
}

// 컨트롤 UI 구성
┌─────────────────────────────────────────────┐
│ [✈️비행모드] [⏸️] [2x▼] [━━━●───] [📹] [🔄] │
│  토글      일시정지  속도   진행률바  카메라 리셋 │
└─────────────────────────────────────────────┘
```

#### 📡 카메라 추적 알고리즘
```typescript
// 카메라 자동 추적 로직
const updateCameraTracking = (currentPoint: GPXPoint, nextPoint: GPXPoint) => {
  // 1. 진행 방향 계산
  const bearing = calculateBearing(currentPoint, nextPoint);
  
  // 2. 카메라 위치 계산 (현재 지점에서 50m 뒤)
  const cameraPosition = calculateOffsetPosition(currentPoint, bearing, -50);
  
  // 3. 지형에 따른 높이 조절
  const elevation = currentPoint.ele || 0;
  const cameraHeight = elevation + 30; // 지면에서 30m 높이
  
  // 4. 부드러운 카메라 이동
  mapRef.current?.easeTo({
    center: [cameraPosition.lng, cameraPosition.lat],
    zoom: 17,
    bearing: bearing + 180, // 진행 방향을 바라보도록
    pitch: 60,
    duration: 100,
  });
};
```

### 2. **웨이포인트 댓글 시스템 완전 통합**

#### 💬 데이터 저장 방식 선택

**Option A: JSONB 내부 저장** (PRD 2025 Q4 방식)
```typescript
// gpx_data.points 내부에 댓글 포함
interface GPXPointWithComments {
  lat: number;
  lng: number;
  ele?: number;
  dist?: number;
  comments?: Array<{
    id: string;
    user_id: string;
    username: string;
    content: string;
    createdAt: string;
    isAdmin: boolean;
  }>;
}
```

**Option B: 별도 테이블** (구현 우선순위 방식)
```sql
-- course_comments_v2 테이블 (권장)
CREATE TABLE course_comments_v2 (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses_v2(id),
  point_index INT NOT NULL,        -- gpx_data.points 배열 인덱스
  lat DECIMAL(9,6) NOT NULL,       -- 댓글 정확한 위치
  lng DECIMAL(9,6) NOT NULL,
  user_id UUID REFERENCES users(id),
  username VARCHAR(100) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_admin_comment BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 실시간 기능을 위한 인덱스
  INDEX idx_realtime (course_id, point_index, created_at DESC)
);
```

**⚡ 채택: Option B (별도 테이블)** 
- 이유: 실시간 구독, 검색, 관리 용이성

#### 💬 댓글 실시간 시스템
```typescript
// Supabase Realtime 구독
const setupCommentSubscription = (courseId: string) => {
  const subscription = supabase
    .channel(`course_comments:${courseId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public', 
      table: 'course_comments_v2',
      filter: `course_id=eq.${courseId}`
    }, (payload) => {
      switch (payload.eventType) {
        case 'INSERT':
          addCommentToMap(payload.new);
          showCommentNotification(payload.new);
          break;
        case 'DELETE':
          removeCommentFromMap(payload.old.id);
          break;
        case 'UPDATE':
          updateCommentOnMap(payload.new);
          break;
      }
    })
    .subscribe();
    
  return () => subscription.unsubscribe();
};
```

#### 🎯 웨이포인트 댓글 UI 상세
```typescript
// 댓글 팝업 컴포넌트
interface CommentPopupProps {
  point: GPXPoint;
  pointIndex: number;
  comments: WaypointComment[];
  courseId: string;
  
  // 권한 관리
  currentUser?: User;
  canComment: boolean;
  canModerate: boolean;  // 관리자 권한
}

// 댓글 작성 제한
const COMMENT_LIMITS = {
  maxLength: 500,           // 최대 글자 수
  maxPerUser: 10,          // 사용자당 최대 댓글 수
  cooldownMinutes: 1,      // 연속 작성 제한 (1분)
  adminCooldown: 0,        // 관리자는 제한 없음
};
```

### 3. **데이터베이스 연동 완전 명세**

#### 🗄️ courses_v2 테이블 완전 정의
```sql
CREATE TABLE courses_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- JSONB 통합 데이터 (PRD 2025 Q4 기준)
  gpx_data JSONB NOT NULL CHECK (
    gpx_data ? 'version' AND 
    gpx_data ? 'points' AND 
    gpx_data ? 'bounds' AND 
    gpx_data ? 'stats'
  ),
  
  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 🚀 성능 최적화: 생성 컬럼 (자동 계산)
  distance_km DECIMAL(6,3) GENERATED ALWAYS AS 
    (ROUND((gpx_data->'stats'->>'totalDistance')::DECIMAL, 3)) STORED,
    
  elevation_gain DECIMAL(6,2) GENERATED ALWAYS AS 
    (ROUND((gpx_data->'stats'->>'elevationGain')::DECIMAL, 2)) STORED,
    
  duration_min INT GENERATED ALWAYS AS 
    ((gpx_data->'stats'->>'estimatedDuration')::INT) STORED,
    
  -- 🗺️ 지도 쿼리 최적화: 경계 좌표
  bounds_min_lat DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'minLat')::DECIMAL) STORED,
  bounds_max_lat DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'maxLat')::DECIMAL) STORED,
  bounds_min_lng DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'minLng')::DECIMAL) STORED,
  bounds_max_lng DECIMAL(9,6) GENERATED ALWAYS AS 
    ((gpx_data->'bounds'->>'maxLng')::DECIMAL) STORED,
    
  -- 📊 통계 정보
  view_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  like_count INT DEFAULT 0
);
```

#### 📊 고급 쿼리 예제
```sql
-- 1. 지도 영역 내 코스 검색 (경계 기반)
SELECT id, title, distance_km, difficulty,
       gpx_data->'points'->0 as start_point
FROM courses_v2 
WHERE is_active = true
  AND bounds_min_lat <= :maxLat 
  AND bounds_max_lat >= :minLat
  AND bounds_min_lng <= :maxLng 
  AND bounds_max_lng >= :minLng
ORDER BY distance_km;

-- 2. 거리별 코스 필터링 (생성 컬럼 활용)
SELECT * FROM courses_v2 
WHERE distance_km BETWEEN 3 AND 10
  AND difficulty = 'medium'
  AND is_active = true;

-- 3. 인기 코스 조회 (댓글, 좋아요 기반)
SELECT *, (comment_count * 2 + like_count) as popularity_score
FROM courses_v2 
WHERE is_active = true
ORDER BY popularity_score DESC
LIMIT 10;
```

### 4. **보안 정책 (RLS) 상세 명세**

#### 🔒 Row Level Security 완전 정의
```sql
-- Enable RLS
ALTER TABLE courses_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 📖 읽기 정책 (누구나 활성 데이터 조회 가능)
CREATE POLICY "courses_public_read" ON courses_v2
  FOR SELECT USING (is_active = true);

CREATE POLICY "comments_public_read" ON course_comments_v2
  FOR SELECT USING (is_active = true);

-- ✏️ 쓰기 정책 (인증된 사용자만)
CREATE POLICY "courses_admin_write" ON courses_v2
  FOR ALL USING (
    auth.jwt() ->> 'is_admin' = 'true' OR
    auth.uid() = created_by
  );

CREATE POLICY "comments_user_write" ON course_comments_v2
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- 🛡️ 수정/삭제 정책 (소유자 또는 관리자)
CREATE POLICY "comments_owner_update" ON course_comments_v2
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'is_admin' = 'true'
  );

CREATE POLICY "comments_owner_delete" ON course_comments_v2
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'is_admin' = 'true'
  );

-- 👥 사용자 프로필 정책
CREATE POLICY "users_own_profile" ON users
  FOR ALL USING (auth.uid() = id);
  
CREATE POLICY "users_public_info" ON users
  FOR SELECT USING (true);  -- 공개 정보 (닉네임, 프로필 이미지)
```

#### 🔐 인증 플로우 상세
```typescript
// 1. 앱 접근 인증 (기존 방식 유지)
interface AppAuth {
  type: 'password';
  table: 'access_links';
  flow: 'password_input' → 'hash_compare' → 'session_create';
}

// 2. 관리자 인증 (JWT 기반)
interface AdminAuth {
  type: 'jwt';
  table: 'admin';
  claims: {
    sub: string;        // user id
    email: string;      // admin email  
    is_admin: boolean;  // admin flag
    exp: number;        // expiry
  };
}

// 3. 소셜 로그인 (추후 확장)
interface SocialAuth {
  type: 'oauth';
  providers: ['kakao', 'google', 'apple'];
  table: 'users';
  flow: 'oauth_redirect' → 'profile_fetch' → 'user_upsert';
}
```

---

## 🚀 로드맵 및 확장성

### 📅 2025 개발 로드맵

#### Q1 (Jan-Mar): 기반 구축
- ✅ **DB 마이그레이션**: courses_v2, comments_v2 완료
- ✅ **비행모드**: 기본 재생 + 카메라 추적
- ✅ **웨이포인트 댓글**: CRUD + 실시간 구독
- 🔄 **성능 최적화**: 인덱스, 캐싱, 이미지 최적화

#### Q2 (Apr-Jun): 소셜 기능
```typescript
// 🏃‍♂️ 완주 인증 시스템
interface RunningRecord {
  id: string;
  user_id: string;
  course_id: string;
  started_at: timestamp;
  completed_at: timestamp;
  actual_distance: number;     // GPS 기록 거리
  actual_duration: number;     // 실제 소요 시간
  gps_track?: GPXPoint[];      // 실제 러닝 경로
  photo_evidence?: string;     // 완주 인증 사진
  is_verified: boolean;        // 관리자 검증
}

// 👥 러닝 메이트 매칭
interface RunningGroup {
  id: string;
  course_id: string;
  organizer_id: string;
  scheduled_time: timestamp;
  max_participants: number;
  current_participants: User[];
  difficulty_level: string;
  pace_range: string;         // "5:00-6:00 min/km"
}

// 🏆 개인 기록 및 순위
interface PersonalStats {
  user_id: string;
  total_runs: number;
  total_distance: number;
  best_time_5k: number;
  best_time_10k: number;
  favorite_courses: string[];
  achievements: Achievement[];
}
```

#### Q3 (Jul-Sep): AI 및 고급 기능
```typescript
// 🤖 AI 코스 추천
interface AIRecommendation {
  user_id: string;
  recommended_courses: {
    course_id: string;
    score: number;           // 0-100 추천 점수
    reasons: string[];       // 추천 이유
    optimal_time: string;    // 최적 러닝 시간
  }[];
  
  // 개인화 팩터
  factors: {
    fitness_level: number;
    preferred_distance: number;
    preferred_difficulty: string;
    time_of_day: string;
    weather_preference: string;
  };
}

// 📊 고급 분석
interface AdvancedAnalytics {
  course_popularity_trends: TimeSeriesData;
  user_behavior_patterns: UserPattern[];
  optimal_route_suggestions: RouteOptimization[];
  weather_impact_analysis: WeatherAnalysis;
}
```

#### Q4 (Oct-Dec): 플랫폼 확장
```typescript
// 🌍 다지역 확장
interface MultiRegionSupport {
  regions: {
    id: string;
    name: string;           // "강남구", "마포구"
    bounds: GeoBounds;
    local_admin: string;
    course_count: number;
  }[];
  
  // 지역별 관리자
  regional_admins: {
    user_id: string;
    region_id: string;
    permissions: string[];
  }[];
}

// 📱 모바일 앱 고도화
interface MobileFeatures {
  offline_maps: boolean;      // 오프라인 지도
  gps_tracking: boolean;      // 실시간 GPS 추적
  voice_guidance: boolean;    // 음성 안내
  apple_health_sync: boolean; // 헬스 앱 연동
  watch_support: boolean;     // 스마트워치 지원
}
```

### 🔧 기술 확장성

#### 🗄️ 데이터베이스 스케일링
```typescript
// 파티셔닝 전략
interface DatabasePartitioning {
  // 날짜별 파티셔닝 (대용량 로그 데이터)
  running_records: 'PARTITION BY RANGE (created_at)';
  
  // 지역별 파티셔닝 (지리적 분산)
  courses_v2: 'PARTITION BY HASH (region_id)';
  
  // 읽기 복제본
  read_replicas: {
    analytics: 'Read-only replica for analytics queries';
    reporting: 'Read-only replica for admin reports';
  };
}

// 캐싱 전략
interface CachingStrategy {
  redis_layers: {
    L1: 'Hot data (active courses) - 1 hour TTL';
    L2: 'Warm data (user preferences) - 6 hour TTL';
    L3: 'Cold data (analytics) - 24 hour TTL';
  };
  
  cdn_strategy: {
    static_assets: 'CloudFlare CDN';
    map_tiles: 'Mapbox CDN';
    user_uploads: 'Supabase Storage CDN';
  };
}
```

#### 🎨 프론트엔드 확장성
```typescript
// 마이크로 프론트엔드 구조
interface MicrofrontendArchitecture {
  shell_app: 'Next.js 메인 앱 (라우팅, 인증)';
  
  feature_modules: {
    map_viewer: 'React 독립 모듈';
    course_manager: 'React 독립 모듈'; 
    user_dashboard: 'React 독립 모듈';
    analytics_panel: 'React 독립 모듈';
  };
  
  shared_libraries: {
    ui_components: '@gsrc81/ui-components';
    map_utilities: '@gsrc81/map-utils';
    data_hooks: '@gsrc81/data-hooks';
  };
}
```

---

## 🔒 보안 및 개인정보 보호

### 🛡️ 보안 강화 방안

#### 🔐 인증 보안
```typescript
interface SecurityMeasures {
  // 비밀번호 정책
  password_policy: {
    min_length: 8;
    require_uppercase: true;
    require_numbers: true;
    require_special_chars: true;
    max_age_days: 90;          // 90일마다 변경 권장
  };
  
  // 세션 관리
  session_security: {
    jwt_expiry: '24h';
    refresh_token_expiry: '7d';
    max_concurrent_sessions: 3;
    idle_timeout: '2h';
  };
  
  // Rate Limiting
  rate_limits: {
    login_attempts: '5/hour';
    comment_creation: '10/minute';
    gpx_uploads: '5/hour';
    api_requests: '1000/hour';
  };
}
```

#### 🚨 모니터링 및 알림
```typescript
interface SecurityMonitoring {
  // 보안 이벤트 로깅
  security_logs: {
    failed_login_attempts: boolean;
    admin_actions: boolean;
    data_access_patterns: boolean;
    suspicious_activity: boolean;
  };
  
  // 자동 알림
  alerts: {
    multiple_failed_logins: 'Slack 알림';
    unauthorized_admin_access: 'Email + SMS';
    unusual_data_access: 'Dashboard 경고';
    system_errors: 'PagerDuty';
  };
  
  // 정기 보안 검사
  security_audits: {
    dependency_scan: 'weekly';
    vulnerability_assessment: 'monthly';
    penetration_testing: 'quarterly';
    compliance_review: 'annually';
  };
}
```

### 📋 개인정보 보호 (GDPR/PIPPA 준수)

#### 🛡️ 데이터 보호 정책
```typescript
interface DataProtectionPolicy {
  // 개인정보 수집 최소화
  data_minimization: {
    required_fields: ['username', 'email'];
    optional_fields: ['profile_image', 'phone'];
    auto_delete_fields: ['gps_tracks', 'device_info'];
  };
  
  // 사용자 권리
  user_rights: {
    data_access: '요청 시 개인정보 제공';
    data_portability: 'JSON 형태 데이터 다운로드';
    data_deletion: '30일 내 완전 삭제';
    data_correction: '실시간 프로필 수정';
  };
  
  // 데이터 보존 정책
  retention_policy: {
    active_users: 'unlimited';
    inactive_users: '2년 후 익명화';
    deleted_users: '30일 후 완전 삭제';
    system_logs: '1년 보관';
  };
}
```

---

## 📱 모바일 최적화 및 PWA

### 📲 Progressive Web App 명세

#### 🚀 PWA 기능
```typescript
interface PWAFeatures {
  // 기본 PWA 기능
  installable: true;
  offline_support: true;
  push_notifications: true;
  background_sync: true;
  
  // 모바일 네이티브 기능
  native_features: {
    camera_access: '완주 인증 사진';
    gps_tracking: '실시간 위치 추적';
    device_orientation: '나침반 기능';
    haptic_feedback: '터치 피드백';
    secure_storage: '인증 정보 저장';
  };
  
  // 성능 최적화
  performance: {
    service_worker: 'Map tiles + API 캐싱';
    lazy_loading: 'Route-based code splitting';
    image_optimization: 'WebP + responsive images';
    bundle_size: '< 500KB initial load';
  };
}
```

#### 📱 Capacitor 네이티브 기능
```typescript
// iOS/Android 네이티브 기능
interface NativeCapabilities {
  // 위치 서비스
  location: {
    high_accuracy_gps: boolean;
    background_location: boolean;
    geofencing: boolean;          // 코스 경계 알림
    location_history: boolean;    // 경로 기록
  };
  
  // 카메라 및 미디어
  camera: {
    photo_capture: boolean;       // 완주 인증
    video_recording: boolean;     // 러닝 영상
    image_gallery: boolean;       // 사진 선택
  };
  
  // 센서
  sensors: {
    accelerometer: boolean;       // 걸음 수 측정
    gyroscope: boolean;           // 기기 방향
    magnetometer: boolean;        // 나침반
    heart_rate: boolean;          // 심박수 (지원 기기)
  };
  
  // 헬스 연동
  health_integration: {
    apple_health: boolean;
    google_fit: boolean;
    samsung_health: boolean;
    fitbit: boolean;
  };
}
```

### 🎨 반응형 디자인 완전 명세

#### 📐 Breakpoint 전략
```css
/* Mobile First + Container Queries */
.responsive-container {
  /* XS: 320px ~ 479px (작은 폰) */
  --padding: 1rem;
  --font-size: 14px;
  --button-height: 44px;
}

@media (min-width: 480px) {
  /* SM: 480px ~ 639px (큰 폰) */
  .responsive-container {
    --padding: 1.5rem;
    --font-size: 16px;
    --button-height: 48px;
  }
}

@media (min-width: 640px) {
  /* MD: 640px ~ 1023px (태블릿) */
  .responsive-container {
    --padding: 2rem;
    --font-size: 16px;
    --grid-columns: 2;
  }
}

@media (min-width: 1024px) {
  /* LG: 1024px ~ 1279px (데스크톱) */
  .responsive-container {
    --padding: 3rem;
    --max-width: 1200px;
    --grid-columns: 3;
  }
}

@media (min-width: 1280px) {
  /* XL: 1280px+ (대형 모니터) */
  .responsive-container {
    --max-width: 1400px;
    --grid-columns: 4;
  }
}
```

#### 🎮 터치 인터랙션 최적화
```typescript
interface TouchOptimization {
  // 터치 타겟 크기
  touch_targets: {
    minimum_size: '44px × 44px';
    recommended_size: '48px × 48px';
    spacing: '8px minimum between targets';
  };
  
  // 제스처 지원
  gestures: {
    pinch_zoom: '지도 확대/축소';
    pan: '지도 이동';
    swipe: '드로워 열기/닫기';
    long_press: '컨텍스트 메뉴';
    double_tap: '빠른 확대';
  };
  
  // 햅틱 피드백
  haptics: {
    button_press: 'light impact';
    success_action: 'notification success';
    error_feedback: 'notification error';
    navigation: 'selection';
  };
}
```

---

## 🧪 테스트 전략

### 🔬 테스트 계층

#### 단위 테스트 (Unit Tests)
```typescript
// 유틸리티 함수 테스트
describe('GPX Utilities', () => {
  test('calculateDistance', () => {
    const p1 = { lat: 37.5665, lng: 126.9780 };
    const p2 = { lat: 37.5675, lng: 126.9790 };
    const distance = calculateDistance(p1, p2);
    expect(distance).toBeCloseTo(0.125, 2); // 125m 오차 범위
  });
  
  test('createUnifiedGPXData', () => {
    const points = mockGPXPoints;
    const result = createUnifiedGPXData(points);
    expect(result.version).toBe('1.1');
    expect(result.points).toHaveLength(points.length);
    expect(result.bounds).toBeDefined();
  });
});
```

#### 통합 테스트 (Integration Tests)
```typescript
// API 엔드포인트 테스트
describe('Course API', () => {
  test('POST /api/courses - GPX upload', async () => {
    const formData = new FormData();
    formData.append('gpx_file', mockGPXFile);
    formData.append('title', 'Test Course');
    
    const response = await fetch('/api/courses', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(201);
    const course = await response.json();
    expect(course.gpx_data.version).toBe('1.1');
  });
});
```

#### E2E 테스트 (End-to-End Tests)
```typescript
// Playwright 기반 E2E 테스트
describe('User Journey', () => {
  test('Complete user flow: Login → Map → Course Detail → Flight Mode', async ({ page }) => {
    // 1. 로그인
    await page.goto('/');
    await page.fill('[data-testid=password-input]', 'test-password');
    await page.click('[data-testid=login-button]');
    
    // 2. 지도 페이지 로드 확인
    await expect(page).toHaveURL('/map');
    await expect(page.locator('[data-testid=mapbox-map]')).toBeVisible();
    
    // 3. 코스 선택
    await page.click('[data-testid=course-marker]:first-child');
    await page.click('[data-testid=course-detail-link]');
    
    // 4. 비행모드 테스트
    await expect(page).toHaveURL(/\/courses\/.+/);
    await page.click('[data-testid=flight-mode-toggle]');
    await expect(page.locator('[data-testid=flight-controls]')).toBeVisible();
    
    // 5. 댓글 작성
    await page.click('[data-testid=waypoint-marker]:first-child');
    await page.fill('[data-testid=comment-input]', 'Test comment');
    await page.click('[data-testid=comment-submit]');
    await expect(page.locator('[data-testid=comment-list]')).toContainText('Test comment');
  });
});
```

#### 성능 테스트 (Performance Tests)
```typescript
// Lighthouse CI 기반 성능 테스트
const performanceTargets = {
  // Core Web Vitals
  largest_contentful_paint: 2.5,    // seconds
  first_input_delay: 100,            // milliseconds  
  cumulative_layout_shift: 0.1,      // score
  
  // Custom metrics
  map_load_time: 3.0,                // seconds
  gpx_parse_time: 1.0,               // seconds
  comment_submit_time: 0.5,          // seconds
  
  // Lighthouse scores
  performance_score: 90,             // /100
  accessibility_score: 95,          // /100
  best_practices_score: 90,         // /100
  seo_score: 85,                    // /100
};
```

---

## 📊 분석 및 모니터링

### 📈 비즈니스 메트릭
```typescript
interface BusinessMetrics {
  // 사용자 참여도
  engagement: {
    daily_active_users: number;
    weekly_active_users: number;
    average_session_duration: number;    // minutes
    course_completion_rate: number;      // percentage
    comment_participation_rate: number; // percentage
  };
  
  // 콘텐츠 성과
  content_performance: {
    most_popular_courses: Course[];
    average_course_rating: number;
    course_discovery_rate: number;      // how users find courses
    gpx_upload_success_rate: number;    // admin upload success
  };
  
  // 기술 성과
  technical_performance: {
    page_load_times: Record<string, number>;
    api_response_times: Record<string, number>;
    error_rates: Record<string, number>;
    uptime_percentage: number;
  };
}
```

### 🔍 사용자 행동 분석
```typescript
interface UserBehaviorAnalytics {
  // 사용자 여정 추적
  user_journey: {
    entry_points: Record<string, number>;
    common_paths: string[][];
    drop_off_points: Record<string, number>;
    conversion_funnels: ConversionStep[];
  };
  
  // 기능 사용률
  feature_usage: {
    flight_mode_usage: number;          // percentage of course views
    comment_creation_rate: number;      // comments per course view
    map_interaction_rate: number;       // map interactions per session
    filter_usage: Record<string, number>; // which filters are used most
  };
  
  // 디바이스 및 브라우저
  device_analytics: {
    mobile_vs_desktop: Record<string, number>;
    browser_distribution: Record<string, number>;
    screen_resolutions: Record<string, number>;
    connection_speeds: Record<string, number>;
  };
}
```

---

## 🌟 결론

본 통합 기획서 v2.0은 다음을 달성합니다:

### ✅ 해결된 불일치 사항
1. **비행모드**: 카메라 추적, 고급 컨트롤 완전 명세
2. **웨이포인트 댓글**: 별도 테이블 방식으로 통일, 실시간 기능 상세화
3. **DB 연동**: 생성 컬럼, 인덱스 전략, RLS 정책 완전 정의
4. **보안 정책**: 인증, 권한, 모니터링 체계 구축

### 🚀 추가된 상세 명세
1. **로드맵**: Q1~Q4 구체적 개발 계획
2. **확장성**: 기술 스케일링, 다지역 지원 방안
3. **보안**: GDPR 준수, 보안 모니터링
4. **모바일**: PWA, Capacitor 네이티브 기능
5. **테스트**: 단위/통합/E2E/성능 테스트 전략
6. **분석**: 비즈니스 메트릭, 사용자 행동 분석

### 🎯 다음 단계
1. **우선순위 설정**: Q1 기능부터 순차 개발
2. **기술 검증**: 핵심 기능 프로토타입 구현
3. **팀 구성**: 프론트엔드, 백엔드, 모바일 전담팀
4. **개발 환경**: CI/CD, 테스트 자동화 구축

이제 **완전하고 일관된 기획서**로 안전하고 체계적인 개발을 진행할 수 있습니다.

---

*최종 업데이트: 2025-01-06*  
*버전: 2.0 (통합 완전판)*  
*작성: GSRC81 개발팀*