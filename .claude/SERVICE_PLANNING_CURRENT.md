# GSRC81 Maps 서비스 기획서 (현행 버전)

## 📋 서비스 개요

**GSRC81 Maps**는 은평구 지역 러닝 코스를 지도로 제공하는 웹/모바일 서비스입니다. GPX 파일 기반으로 정확한 러닝 루트를 표시하며, 코스별 상세 정보와 커뮤니티 댓글 기능을 제공합니다.

---

## 🎯 핵심 목표

- **정확성**: GPX 데이터 기반 실제 러닝 경로 제공
- **접근성**: PWA로 웹/모바일 모두 지원
- **커뮤니티**: 코스별 댓글로 러너들의 경험 공유

## 👥 타겟 사용자

- **주 타겟**: GSRC81 러닝크루 멤버
- **서브 타겟**: 은평구 지역 러너

---

## 🗺️ 현재 서비스 구조

### 1. 사용자 플로우

```
초기 접속
↓
비밀번호 인증 (access_links 테이블)
↓
메인 지도 페이지 (/map)
- 은평구 중심 지도
- 코스별 마커 표시
- 드로워 방식 코스 리스트
↓
코스 선택 시
↓
코스 상세 페이지 (/courses/[id])
- GPX 경로 시각화
- 애니메이션 재생
- km 마커 표시
- 댓글 시스템 (현재 비활성화)
```

### 2. 관리자 플로우

```
관리자 로그인 (/admin/login)
↓
관리자 대시보드 (/admin)
↓
코스 관리 (/admin/courses)
- GPX 파일 업로드
- 코스 정보 입력
- 코스 수정/삭제
```

---

## 💾 현재 데이터 구조

### 데이터베이스 테이블

```sql
-- 1. courses (메인 테이블)
- id, title, description
- gpx_coordinates (JSON 문자열) 
- start_latitude/longitude, end_latitude/longitude
- distance_km, avg_time_min, elevation_gain
- difficulty (easy/medium/hard)
- nearest_station
- is_active, created_at

-- 2. course_points (중복 저장)
- course_id, seq
- latitude, longitude, elevation
- created_at

-- 3. course_comments
- course_id, author_nickname, message
- likes_count (미사용)
- is_active, created_at

-- 4. access_links (앱 접근 제어)
- access_code, password_hash
- is_active

-- 5. admin (관리자 계정)
- username, password_hash
```

### 스토리지

- **Supabase Storage**: GPX 파일 원본 저장 (현재 미사용)
- **DB 저장**: gpx_coordinates, course_points 중복 저장

---

## 🎨 현재 구현된 기능

### 1. 지도 기능
- ✅ Mapbox GL 기반 지도 표시
- ✅ 코스별 마커 및 경로 표시  
- ✅ 드로워 UI로 코스 리스트
- ✅ 필터링 (거리별)
- ✅ 현재 위치 표시

### 2. 코스 상세
- ✅ GPX 경로 시각화
- ✅ 트레일 애니메이션
- ✅ km 단위 마커 표시
- ✅ 고도 정보 표시
- ✅ 드론 카메라 뷰

### 3. 관리 기능
- ✅ GPX 파일 업로드 및 파싱
- ✅ 코스 CRUD
- ✅ 관리자 인증
- ✅ 비밀번호 변경

### 4. 모바일 지원
- ✅ Capacitor 기반 iOS/Android 앱
- ✅ 반응형 디자인
- ✅ PWA 지원

---

## 🐛 현재 문제점

### 1. 데이터 구조 문제
- **중복 저장**: gpx_coordinates와 course_points 중복
- **형식 불일치**: lat/lng vs lat/lon vs latitude/longitude
- **성능 이슈**: course_points N개 row 조회

### 2. 코드 복잡도
- 3개의 다른 GPX 데이터 처리 로직
- 컴포넌트 간 데이터 형식 변환 반복

### 3. 미완성 기능
- 댓글 시스템 UI 미완성
- 좋아요 기능 미구현
- 사용자 프로필 미사용

---

## 🔧 개선 계획

### Phase 1: 데이터 구조 통합 (1주)
1. **단일 JSONB 컬럼으로 통합**
   - course_points 테이블 제거
   - gpx_data JSONB 컬럼 사용
   
2. **표준 데이터 형식 정의**
   ```typescript
   interface UnifiedGPXData {
     version: "1.0";
     points: Array<{lat, lng, ele?, dist?}>;
     bounds: {minLat, maxLat, minLng, maxLng};
     stats: {totalDistance, elevationGain, ...};
   }
   ```

### Phase 2: 코드 리팩토링 (1주)
1. **통합 데이터 로더 작성**
2. **컴포넌트 단순화**
3. **중복 코드 제거**

### Phase 3: 기능 완성 (2주)
1. **댓글 시스템 활성화**
   - UI 개선
   - 실시간 업데이트
   
2. **사용자 경험 개선**
   - 로딩 상태 개선
   - 에러 처리 강화
   - 애니메이션 최적화

### Phase 4: 신규 기능 (2주)
1. **러닝 기록**
   - 완주 인증
   - 개인 기록 저장
   
2. **소셜 기능**
   - 코스 공유
   - 러닝 메이트 찾기

---

## 📊 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Map**: Mapbox GL JS, React Map GL
- **UI**: Radix UI, Shadcn/ui
- **Animation**: Framer Motion
- **State**: React Context

### Backend  
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime

### Mobile
- **Framework**: Capacitor
- **Platforms**: iOS, Android
- **PWA**: Service Worker

---

## 📈 성공 지표

### 현재 추적 가능
- 월간 활성 사용자 수
- 코스별 조회수
- GPX 업로드 수
- 관리자 활동 로그

### 향후 추적 예정
- 완주 인증 수
- 댓글 참여율
- 평균 세션 시간
- 모바일 앱 설치 수

---

## 🚀 로드맵

### 2025 Q1
- ✅ MVP 출시
- ⏳ 데이터 구조 개선
- ⏳ 댓글 시스템 활성화

### 2025 Q2
- 러닝 기록 기능
- 소셜 기능 추가
- 성능 최적화

### 2025 Q3
- 다른 지역 확장
- AI 코스 추천
- 웨어러블 연동

---

## 📱 화면 구성

### 1. 메인 지도 (/map)
```
┌─────────────────────────────────┐
│         Mapbox 지도              │
│     🔵 🟢 🔴 코스 마커           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  하단 드로워 (코스 리스트)    │ │
│ │  - 코스 카드                 │ │
│ │  - 필터 버튼                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 2. 코스 상세 (/courses/[id])
```
┌─────────────────────────────────┐
│       코스 정보 헤더             │
│   제목, 거리, 난이도, 시간       │
├─────────────────────────────────┤
│                                 │
│        GPX 경로 지도             │
│     애니메이션 컨트롤            │
│        km 마커 표시              │
│                                 │
├─────────────────────────────────┤
│      댓글 섹션 (예정)            │
└─────────────────────────────────┘
```

### 3. 관리자 대시보드 (/admin)
```
┌─────────────────────────────────┐
│        관리자 네비게이션         │
├─────────────────────────────────┤
│                                 │
│    GPX 업로드 폼                │
│    코스 정보 입력                │
│                                 │
├─────────────────────────────────┤
│      코스 목록 그리드            │
│    수정/삭제 버튼                │
└─────────────────────────────────┘
```

---

## 🔒 보안 및 인증

### 현재 구현
- **사용자**: 비밀번호 기반 접근 제어
- **관리자**: 별도 관리자 계정 시스템
- **세션**: localStorage 기반 토큰 저장

### 개선 필요
- JWT 토큰 만료 시간 설정
- Rate limiting
- SQL injection 방지

---

## 📝 기타 고려사항

### 성능
- 대용량 GPX 파일 처리 최적화 필요
- 지도 타일 캐싱 전략 수립
- 이미지 lazy loading

### 접근성
- 키보드 네비게이션 개선
- 스크린 리더 지원
- 고대비 모드

### 분석
- Google Analytics 연동
- 사용자 행동 추적
- 에러 모니터링 (Sentry)

---

*작성일: 2025년 1월*
*작성자: GSRC81 개발팀*