# 🚀 GSRC81 MAPS 개발 프롬프트 (최종 버전)

## ⚠️ **중요 주의사항**

### ❌ **기존 코드 사용 금지**
- 현재 작성된 코드들은 **이전 스키마** 기반
- 필드명, 테이블 구조가 **구버전**
- **참고용으로만** 사용, 직접 활용 금지

### ✅ **새로운 DB 우선 원칙**
- **최신 스키마** (단순화 완료된 버전) 기준
- **새로운 필드명** 반영
- **정리된 테이블 구조** 기반

---

## 📊 **최신 데이터베이스 스키마 (2025-10-17 기준)**

### 🗄️ **테이블 구조**

#### **ADMIN** (관리자)
```typescript
interface Admin {
  id: string;                    // UUID
  username: string;              // 관리자 사용자명
  password_hash: string;         // 비밀번호 해시
  created_at: string;            // 생성일시
  last_login_at?: string;        // 마지막 로그인
}
```

#### **ACCESS_LINKS** (사용자 접근)
```typescript
interface AccessLink {
  id: string;                    // UUID
  access_code: string;           // 접근 코드
  is_active: boolean;            // 활성화 상태
  kakao_user_id?: string;        // 카카오 사용자ID
  kakao_nickname?: string;       // 카카오 닉네임
  kakao_profile_url?: string;    // 카카오 프로필
  created_at: string;            // 생성일시
  updated_at: string;            // 수정일시
}
```

#### **COURSE_CATEGORIES** (코스 카테고리)
```typescript
interface CourseCategory {
  id: string;                    // UUID
  key: string;                   // 카테고리 키
  name: string;                  // 카테고리 이름
  sort_order: number;            // 정렬 순서
  is_active: boolean;            // 활성화 상태
  description?: string;          // 카테고리 설명
  cover_image_url?: string;      // 커버 이미지
  created_at: string;            // 생성일시
}
```

#### **COURSES** (러닝 코스)
```typescript
interface Course {
  id: string;                    // UUID
  category_id: string;           // 카테고리 ID
  title: string;                 // 코스 제목
  description: string;           // 코스 설명
  cover_image_url?: string;      // 대표 이미지
  difficulty: 'easy' | 'medium' | 'hard'; // 난이도
  distance_km: number;           // 거리 (km)
  avg_time_min: number;         // 평균 소요시간
  elevation_gain: number;        // 고도 상승 (m)
  start_latitude: number;        // 시작점 위도
  start_longitude: number;       // 시작점 경도
  gpx_data: GPXData;            // GPX 데이터
  tags: string[];               // 태그 배열
  sort_order: number;           // 정렬 순서
  is_active: boolean;           // 활성화 상태
  created_at: string;           // 생성일시
  updated_at: string;           // 수정일시
}

interface GPXData {
  points: Array<{
    lat: number;
    lng: number;
    dist: number;               // 1km 마커용
    elevation?: number;
  }>;
  stats: {
    totalDistance: number;
    elevationGain: number;
    estimatedDuration: number;
  };
  metadata: {
    startPoint: { lat: number; lng: number };
    endPoint: { lat: number; lng: number };
    importedAt: string;
  };
}
```

#### **COURSE_LOCATION_NOTES** (비행 노트)
```typescript
interface CourseLocationNote {
  id: string;                    // UUID
  course_id: string;            // 코스 ID
  latitude: number;             // 위도
  longitude: number;            // 경도
  title: string;                // 노트 제목
  content: string;              // 노트 내용
  memo_type: 'general' | 'warning' | 'highlight' | 'rest'; // 노트 타입
  show_during_animation: boolean; // 비행 중 표시
  route_index: number;          // 경로 순서
  is_active: boolean;           // 활성화 상태
  created_at: string;           // 생성일시
}
```

#### **COURSE_COMMENTS** (코스 댓글)
```typescript
interface CourseComment {
  id: string;                    // UUID
  course_id: string;            // 코스 ID
  author_nickname: string;       // 작성자 닉네임
  avatar_url?: string;          // 아바타 URL
  author_user_key: string;       // 작성자 키
  message: string;              // 댓글 내용
  latitude?: number;            // 댓글 위치 위도
  longitude?: number;           // 댓글 위치 경도
  likes_count: number;          // 좋아요 수
  is_flagged: boolean;          // 신고 여부
  hidden_by_admin: boolean;     // 관리자 숨김
  edited_at?: string;           // 수정일시
  is_deleted: boolean;          // 삭제 여부
  created_at: string;           // 생성일시
  updated_at: string;           // 수정일시
}
```

#### **COURSE_COMMENT_PHOTOS** (댓글 사진)
```typescript
interface CourseCommentPhoto {
  id: string;                    // UUID
  comment_id: string;           // 댓글 ID
  file_url: string;             // 파일 URL
  sort_order: number;           // 정렬 순서
  created_at: string;           // 생성일시
}
```

#### **APP_SETTINGS** (앱 설정)
```typescript
interface AppSetting {
  id: string;                    // UUID
  setting_key: string;           // 설정 키
  setting_value: string;         // 설정 값
  updated_at: string;           // 수정일시
}
```

#### **COURSE_STATISTICS** (통계 뷰)
```typescript
interface CourseStatistics {
  course_id: string;            // 코스 ID
  title: string;                // 코스 제목
  comment_count: number;        // 댓글 수
  visible_comments: number;     // 표시 댓글 수
  point_count: number;          // GPX 포인트 수
}
```

---

## 🎨 **디자인 기준**

### 📱 **Figma 디자인 참조**
- **Figma URL**: https://www.figma.com/design/kOLiZAR3ceVMuyW4abWsHB/GSRC81-MAPS?node-id=1-2062&p=f&t=ElSHAdQ8wUX8NF10-0
- **디자인 확정**: PDF 파일 기반
- **반응형 디자인**: 모바일 우선, 데스크톱 대응

### 🎯 **주요 디자인 요소**
- **컬러 팔레트**: Figma에서 추출
- **타이포그래피**: Figma 폰트 시스템
- **컴포넌트**: 재사용 가능한 UI 컴포넌트
- **애니메이션**: 부드러운 전환 효과

---

## 🏗️ **개발 구조**

### 📁 **프로젝트 구조**
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── admin/             # 관리자 페이지
│   ├── courses/           # 코스 관련 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 재사용 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── admin/            # 관리자 전용 컴포넌트
│   └── course/           # 코스 관련 컴포넌트
├── lib/                  # 유틸리티 함수
│   ├── supabase.ts       # Supabase 클라이언트
│   ├── api/              # API 함수들
│   └── utils/            # 공통 유틸리티
├── contexts/             # React Context
│   ├── AuthContext.tsx   # 사용자 인증
│   └── AdminContext.tsx  # 관리자 인증
└── types/                # TypeScript 타입 정의
    └── database.ts       # DB 타입 정의
```

### 🔧 **기술 스택**
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Kakao
- **Maps**: Mapbox GL JS
- **State Management**: React Context + Zustand

---

## 📋 **개발 우선순위**

### 🥇 **1단계: 기본 구조**
1. **타입 정의** - 최신 DB 스키마 기반
2. **인증 시스템** - 사용자/관리자 로그인
3. **기본 레이아웃** - Figma 디자인 적용
4. **지도 컴포넌트** - Mapbox 연동

### 🥈 **2단계: 코스 기능**
1. **코스 목록** - 카테고리별 필터링
2. **코스 상세** - GPX 애니메이션
3. **비행 모드** - 1km 마커, 노트 표시
4. **댓글 시스템** - 위치 기반 댓글

### 🥉 **3단계: 관리자 기능**
1. **관리자 대시보드** - 통계 및 관리
2. **코스 관리** - GPX 업로드, 편집
3. **댓글 관리** - 신고 처리, 숨김
4. **사용자 관리** - 접근 권한 관리

---

## 🎯 **핵심 기능 구현**

### 🗺️ **지도 기능**
- **Mapbox GL JS** 사용
- **GPX 애니메이션** - 실시간 경로 표시
- **1km 마커** - `gpx_data.points[].dist` 기반
- **비행 모드** - 노트 및 마커 표시
- **위치 기반 댓글** - 지도 클릭으로 댓글 작성

### 💬 **댓글 시스템**
- **카카오 로그인** 연동
- **위치 정보** 포함 댓글
- **이미지 첨부** - Supabase Storage
- **좋아요 기능** - 실시간 업데이트
- **관리자 제어** - 신고/숨김 처리

### 🔐 **인증 시스템**
- **사용자**: 접근 코드 기반
- **관리자**: 사용자명/비밀번호
- **카카오 로그인**: 사용자 정보 연동
- **RLS 정책**: 행 수준 보안

---

## 📝 **개발 가이드라인**

### ✅ **필수 사항**
1. **최신 DB 스키마** 기반으로만 개발
2. **Figma 디자인** 100% 준수
3. **TypeScript** 엄격 모드 사용
4. **반응형 디자인** 모바일 우선
5. **접근성** 고려 (a11y)

### 🚫 **금지 사항**
1. **기존 코드** 직접 사용 금지
2. **이전 스키마** 기반 개발 금지
3. **하드코딩** 값 사용 금지
4. **타입 안전성** 무시 금지

---

## 🚀 **시작 명령어**

```bash
# 프로젝트 초기화
npm install

# 개발 서버 시작
npm run dev

# 타입 체크
npm run type-check

# 빌드
npm run build
```

---

## 📞 **지원 및 문의**

- **DB 스키마**: 최신 단순화 버전 사용
- **디자인**: Figma 시안 준수
- **기능**: PDF 요구사항 100% 반영
- **코드**: 완전히 새로운 구조로 개발

---

**🎯 이 프롬프트를 기반으로 GSRC81 MAPS를 완전히 새로 개발하세요!**
