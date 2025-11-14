# GSRC81 Maps 인증 플로우 문서

## 인증 시스템 아키텍처

### 핵심 원칙
- **단일 책임**: 카카오 콜백이 모든 DB 검증을 담당
- **최초 1회**: 접근 코드는 최초 가입 시에만 필요
- **즉시 처리**: 기존 사용자는 바로 /map 이동

## 전체 플로우 다이어그램

```mermaid
graph TD
    A[사용자 방문] --> B{온보딩 완료?}
    B -->|No| C[스플래시 스크린]
    B -->|Yes| D{인증 상태?}
    
    C --> E[온보딩 완료]
    E --> D
    
    D -->|인증됨| F[/map 페이지]
    D -->|미인증| G[/login 페이지]
    
    G --> H[카카오 로그인 클릭]
    H --> I[카카오 OAuth]
    I --> J[/callback]
    
    J --> K{DB에서 사용자 조회}
    K -->|기존 사용자| L[인증 쿠키 설정]
    K -->|최초 사용자| M[/verify 페이지]
    
    L --> N[/map 직접 리다이렉트]
    
    M --> O[접근 코드 입력]
    O --> P{코드 검증}
    P -->|실패| Q[에러 메시지]
    P -->|성공| R[DB 업데이트 + 쿠키 설정]
    
    Q --> O
    R --> S[/map 리다이렉트]
```

## 상세 플로우

### 1. 최초 사용자 플로우

```
사용자 방문 → 스플래시 → 로그인 페이지
    ↓
카카오 로그인 버튼 클릭
    ↓
카카오 OAuth 인증
    ↓
/api/auth/kakao/callback → DB 조회 (사용자 없음)
    ↓
/verify?uid=123456 리다이렉트
    ↓
접근 코드 입력 → DB 업데이트 → 인증 쿠키 설정
    ↓
/map 페이지로 리다이렉트
```

### 2. 기존 사용자 플로우

```
사용자 방문 → 로그인 페이지
    ↓
카카오 로그인 버튼 클릭
    ↓
카카오 OAuth 인증
    ↓
/api/auth/kakao/callback → DB 조회 (기존 사용자 발견)
    ↓
인증 쿠키 설정 → /map 직접 리다이렉트 (verify 스킵)
```

### 3. 인증된 사용자 재방문

```
사용자 방문 → AuthContext 쿠키 체크
    ↓
유효한 인증 쿠키 발견 → /map 자동 리다이렉트
```

## 코드 구조

### 파일별 역할

#### `/src/app/api/auth/kakao/callback/route.ts`
**모든 인증 검증의 단일 진입점**
- 카카오 OAuth 처리 및 사용자 정보 획득
- DB에서 사용자 존재 여부 확인
- 기존 사용자 → `/map`, 최초 사용자 → `/verify`

#### `/src/app/login/page.tsx`
**로그인 페이지**
- 스플래시 스크린 및 온보딩 처리
- 카카오 로그인 버튼
- 인증된 사용자 자동 리다이렉트

#### `/src/app/verify/page.tsx`
**접근 코드 입력 페이지 (최초 1회만)**
- 접근 코드 검증
- DB 업데이트 (kakao_user_id 연결)
- 인증 완료 후 `/map` 이동

#### `/src/contexts/AuthContext.tsx`
**인증 상태 관리**
- 쿠키에서 인증 정보 읽기
- 클라이언트 사이드 인증 상태 제공

#### `/src/middleware.ts`
**라우트 보호**
- `/map`, `/courses`, `/admin` 보호
- 인증 쿠키 검증
- 미인증 시 `/login` 리다이렉트

## 인증 쿠키 구조

```typescript
interface AuthCookie {
  authenticated: boolean;     // 항상 true
  timestamp: number;          // 발행 시간 (24시간 유효)
  type: "kakao";             // 인증 방식
  kakaoUserId: string;       // 카카오 사용자 ID
  kakaoNickname?: string;    // 카카오 닉네임 (옵셔널)
}
```

## 데이터베이스 스키마

### access_links 테이블
```sql
CREATE TABLE access_links (
  id UUID PRIMARY KEY,
  access_code VARCHAR UNIQUE,     -- 관리자 발급 코드
  kakao_user_id VARCHAR,          -- 카카오 사용자 ID (연결 후)
  kakao_nickname VARCHAR,         -- 카카오 닉네임
  is_active BOOLEAN DEFAULT false, -- 활성화 상태
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 보안 및 설정

### 인증 쿠키
- 24시간 만료, SameSite: Lax
- 카카오 사용자 ID 및 닉네임 포함

### 데이터베이스
```sql
access_links 테이블:
- access_code: 관리자 발급 코드
- kakao_user_id: 카카오 사용자 ID
- is_active: 활성화 상태
```

### 라우트 보호
- `/map`, `/courses`, `/admin` 경로 보호
- 미들웨어에서 쿠키 검증
- 만료/유효하지 않은 경우 `/login` 리다이렉트

---

*GSRC81 Maps 인증 시스템 최종본 - 2025.11.13*