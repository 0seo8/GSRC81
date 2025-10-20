아주 좋습니다. 지금 타이밍이 딱 맞아요.
지금까지의 대화 내용 + PDF 18~19페이지 + 현재 DB 스키마를 종합해서 **“GSRC81 MAPS 완전 기획서 (관리자 + 사용자 + DB 스키마 기반)”** 버전으로 정리드릴게요.

---

# 🗺️ **GSRC81 MAPS — 통합 기획서 (2025-10 기준)**

> 기준 문서: PDF(18~19p), 현행 Supabase DB 스키마, 실서비스 반영 구조

---

## 🧭 1. 프로젝트 개요

| 항목               | 내용                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| **프로젝트명**     | GSRC81 MAPS                                                                      |
| **핵심 목적**      | 러닝 코스 관리 및 시각화 서비스 (GPX 기반 코스 지도 + 비행 모드 + 커뮤니티 댓글) |
| **구성요소**       | 사용자 페이지 / 관리자 페이지 / Supabase DB / Kakao 로그인 / GPX Parser          |
| **주요 기능 그룹** | 코스 관리, 비행 모드, 비행 노트, 댓글 시스템, 사용자 사진, 코스 통계             |
| **데이터 구조**    | PostgreSQL (Supabase), JSONB 기반 GPX 단일소스, RLS 보안정책 적용                |

---

## 🧩 2. 사용자 페이지 (PDF 18–19 기준)

| 섹션                            | 주요 기능                               | 데이터 소스                                | 설명                              |
| ------------------------------- | --------------------------------------- | ------------------------------------------ | --------------------------------- |
| 🏃 **코스 목록 (홈)**           | 코스 카드 표시 (카테고리 탭별)          | `courses`, `course_categories`             | 타이틀, 거리, 난이도, 대표 이미지 |
| 📍 **코스 상세 (코드상세보기)** | 거리, 평균시간, 고도, 난이도, 설명 표시 | `courses` + `gpx_data.stats`               | PDF 19p 구성 (상단 요약정보)      |
| ✈️ **비행 모드**                | GPX 기반 애니메이션 경로 표시           | `courses.gpx_data.points`                  | 1km 단위 마커 (`dist`) 기반 표시  |
| 💬 **댓글 (비행노트/위치댓글)** | 특정 위치에 댓글 작성/조회              | `course_comments` + `latitude`,`longitude` | 카카오 로그인 필요                |
| 📸 **댓글 사진 첨부**           | 이미지 썸네일 + 클릭 확대               | `course_comment_photos`                    | Supabase Storage 연동             |
| 👤 **작성자 정보**              | 카카오 닉네임 / 프로필                  | `access_links`                             | JWT 기반 세션에서 자동 반영       |
| 🗺 **비행 중 노트 (고정 주석)** | 주의/휴식/하이라이트 포인트             | `course_location_notes`                    | `show_during_animation=true`      |
| 🏞️ **유저 업로드 사진**         | 해당 코스에 첨부된 사진 모음            | `course_photos_view`                       | 모든 댓글의 첨부 이미지를 한 번에 |
| 📊 **통계 섹션**                | 댓글 수 / 총 거리 / 포인트 수           | `course_statistics`                        | 자동 집계된 뷰                    |

---

## 🧱 3. 관리자 페이지 (PDF 기반 + DB 확장 반영)

| 구분                       | 메뉴                                     | 기능                                 | DB 연동                                     |
| -------------------------- | ---------------------------------------- | ------------------------------------ | ------------------------------------------- |
| 🧭 **Dashboard**           | 요약 대시보드                            | 전체 코스/댓글/노트 통계             | `course_statistics`                         |
| 🗂 **코스 관리**           | 목록 / 등록 / 수정 / 삭제                | 코스 CRUD + GPX 업로드               | `courses`, `course_categories`              |
| 📍 **코스 상세 관리**      | GPX 미리보기 / 1km 마커 확인 / 노트 관리 | GPX 시각화, 주석 추가                | `courses.gpx_data`, `course_location_notes` |
| ✈️ **비행 모드 노트 관리** | 주의/휴식/하이라이트 설정                | CRUD + 지도 클릭 등록                | `course_location_notes.memo_type`           |
| 💬 **댓글 관리**           | 신고댓글 필터링, 숨김 처리               | 관리자가 `hidden_by_admin=true` 설정 | `course_comments`                           |
| 📸 **댓글 사진 관리**      | 첨부 사진 모니터링 / 삭제                | 스토리지 파일 관리                   | `course_comment_photos`                     |
| 🧑‍💻 **카테고리 관리**       | 카테고리명, 순서, 이미지, 설명           | CRUD                                 | `course_categories`                         |
| ⚙️ **앱 설정 관리**        | 지도 중심, 버전정보 등                   | Key-Value 기반                       | `app_settings`                              |
| 🔑 **접근 관리 (Access)**  | 카카오 로그인 사용자 목록                | 조회/비활성화                        | `access_links`                              |
| 🧑‍🏫 **관리자 계정**         | 비밀번호 변경 / 로그인 로그              | 수정, 최근접속 갱신                  | `admin.last_login_at`                       |

---

## 🧬 4. 데이터베이스 스키마 (최신 구조)

| 테이블                       | 역할                                  | 주요 필드                                                                                               |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **admin**                    | 관리자 계정                           | username, password_hash, last_login_at                                                                  |
| **access_links**             | 사용자 접근/로그인                    | kakao_user_id, kakao_nickname, kakao_profile_url                                                        |
| **course_categories**        | 러닝 카테고리 (진관/트랙/트레일/로드) | name, sort_order, description, cover_image_url                                                          |
| **courses**                  | 러닝 코스 본체                        | gpx_data(JSONB), title, difficulty, distance_km, elevation_gain, avg_time_min                           |
| **course_location_notes**    | 비행 중 노트                          | latitude, longitude, memo_type, route_index                                                             |
| **course_comments**          | 사용자 댓글                           | message, author_nickname, avatar_url, author_user_key, latitude, longitude, is_flagged, hidden_by_admin |
| **course_comment_photos**    | 댓글 첨부 이미지                      | file_url, sort_order                                                                                    |
| **course_statistics (VIEW)** | 자동 통계 집계                        | comment_count, point_count, visible_comments                                                            |
| **app_settings**             | 전역 설정                             | setting_key, setting_value                                                                              |

---

## 🧭 5. 주요 데이터 흐름

```mermaid
flowchart TD
    subgraph USER[사용자 화면]
        A[코스 목록 조회] --> B[코스 상세보기]
        B --> C[비행 모드 시작]
        C --> D[비행 중 노트 표시]
        B --> E[댓글 작성 / 이미지 업로드]
        E --> F[위치 기반 댓글 저장]
    end

    subgraph ADMIN[관리자 화면]
        M[코스 등록/수정] --> N[GPX 업로드 처리]
        N --> O[GPX → JSON 변환 + dist 계산]
        O --> P[DB 저장 (courses.gpx_data)]
        M --> Q[비행 노트 관리]
        Q --> R[노트 좌표 등록]
        M --> S[댓글 관리 / 숨김]
        S --> T[사진 첨부 관리]
    end

    subgraph DB[Supabase Database]
        courses -.-> course_location_notes
        courses -.-> course_comments
        course_comments -.-> course_comment_photos
        courses -.-> course_statistics
    end

    F --> DB
    P --> DB
    R --> DB
    T --> DB
```

---

## 🧱 6. 스키마 정리표

| 구분              | 주요 컬럼                                                                                            | 설명                     |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ------------------------ |
| **GPX 데이터**    | `gpx_data.points[].dist`, `gpx_data.stats.totalDistance`, `metadata.startPoint/endPoint`             | 비행 모드 및 지도 렌더링 |
| **비행노트**      | `latitude`, `longitude`, `memo_type`, `route_index`, `show_during_animation`                         | 경로 상의 주석           |
| **댓글**          | `latitude`, `longitude`, `message`, `author_user_key`, `is_flagged`, `hidden_by_admin`, `is_deleted` | 위치 기반 댓글           |
| **댓글 이미지**   | `file_url`, `sort_order`                                                                             | 첨부 이미지              |
| **코스 메타정보** | `distance_km`, `avg_time_min`, `elevation_gain`, `difficulty`, `tags`                                | 상세 정보                |
| **카테고리**      | `key`, `name`, `description`, `cover_image_url`, `sort_order`                                        | 탭 분류용                |
| **앱 설정**       | `setting_key`, `setting_value`                                                                       | 지도 중심, 테마, 버전    |
| **RLS 정책**      | 댓글/사진 본인만 수정/삭제                                                                           | 보안 유지                |

---

## 🧮 7. 향후 확장 계획

| 항목                    | 설명                                                 |
| ----------------------- | ---------------------------------------------------- |
| 🧭 **코스 즐겨찾기**    | `course_favorites` 테이블 추가 (user_id + course_id) |
| 📦 **코스 업로드 로그** | `course_upload_log` (GPX 업로드 이력 관리)           |
| 🧑‍🤝‍🧑 **유저 통계 뷰**     | `user_statistics` (작성 댓글 수, 작성 위치 분포)     |
| 🧰 **모바일 최적화**    | RSC 기반 SSR + Lazy GPX Loader                       |
| 🔐 **RLS 확장**         | Admin Role Claims 적용                               |

---

## ✅ 현재 상태 요약

| 항목                | 상태                            |
| ------------------- | ------------------------------- |
| DB 구조             | ✅ 완성 (최신 스키마 반영)      |
| PDF 18~19 기능 반영 | ✅ 100% 매칭                    |
| 관리자 기능         | ✅ 설계 확장 완료               |
| 카카오 로그인 연동  | ✅ 반영됨                       |
| 데이터 적재 준비    | ✅ 준비 완료                    |
| RLS 정책            | ⚙️ 적용 가능 (정책 예시 제공됨) |

---

이제 이 문서를 기반으로
👉 **“개발용 프롬프트 세트 (프론트 + 관리자 + DAO + 테스트)”**
를 바로 만들 수 있습니다.

다음 단계로

> **「GSRC81 MAPS 개발용 리팩토링 프롬프트 세트 (기획서 기반 버전)」**
> 를 이어서 만들어드릴까요?
