아래 프롬프트들은 “전체 리팩토링 브리핑 → 폴더/파일 단위 → 컴포넌트/훅 단위 → SQL/마이그레이션/정책 → 테스트/성능 → 리뷰 체크리스트” 흐름으로 구성되어 있고, **이번에 확정한 스키마와 기능 범위(PDF 기준)** 를 강하게 가드레일로 둡니다.

---

# 0) 공통 컨텍스트 (모든 프롬프트 맨 위에 붙이기)

```
컨텍스트:
- 프로젝트: GSRC81 MAPS (Next.js + TypeScript + Supabase/Postgres)
- 지도 서비스: 러닝 코스, 비행 애니메이션, 1km 마커, 비행 중 노트, 사용자 댓글(편집/삭제/사진 첨부), 카카오 로그인
- 단일 소스: courses.gpx_data(JSONB) points[].{lat,lng,ele,dist}, stats.totalDistance
- 카테고리: course_categories (jingwan/track/trail/road …)
- 핵심 테이블:
  course_categories, courses, course_location_notes, course_comments, course_comment_photos, access_links, admin
- 금지 사항: PDF에 있는 기능을 삭제/축소하지 말 것. 레거시 중복 소스(gpx_coordinates, course_points)는 참조만 허용, 신규코드에서 사용 금지.
- 안전 기준: 타입 안정성, RLS/권한, XSS/주입 방어, 파일 업로드 보안(서명 URL)
- 목표: 가독성↑, 중복↓, 성능↑, 일관성↑, 테스트 커버리지↑, 배포 리스크↓
```

---

# 1) 전체 리팩토링 브리핑 프롬프트

```
목표:
- GSRC81 MAPS 레포 전체를 모듈화/정리하고, 이번에 확정한 스키마에 맞게 데이터 접근을 일원화한다.
- gpx_data 단일 소스, 1km 마커(dist), 댓글 편집/삭제/사진 첨부, 카카오 로그인 흐름을 보장한다.

요구사항:
1) 데이터 계층
   - Supabase 쿼리 로직을 /lib/db 또는 /data-access 레이어로 모으고, 모든 화면에서 동일 함수만 사용.
   - courses, course_categories, course_location_notes, course_comments(+photos), access_links, admin 외 테이블 의존 제거.
   - gpx_coordinates, course_points, courses_backup 등 레거시 경로 사용 금지(읽기 전환기 제외).

2) 도메인 타입/DTO
   - /types/domain.ts에 Course, Category, GPXPoint, GPXData, CourseNote, Comment, CommentPhoto, AccessUser 정의.
   - zod 스키마로 런타임 검증 추가, API/DB ↔ UI 변환은 mapper 함수로 분리.

3) GPX 로더
   - 업로드 시 points[].dist 계산(haversine), stats.totalDistance 산출.
   - 1km 마커는 렌더 시 points.filter(p => Math.abs(p.dist % 1000) < 10)로 추출.

4) 댓글/사진
   - 댓글 CRUD + 사진 1:N 업로드(서명 URL) + 본인만 편집/삭제(RLS/권한).
   - is_deleted 소프트 삭제 반영, edited_at/edit_count 업데이트.

5) UI 구조
   - /app/(public)/map, /app/(public)/courses/[id], /app/(admin)/... 로 라우팅 명확화.
   - 컴포넌트는 dumb/presentational vs container/hooks 분리.
   - 폴더별 index barrel 제거 또는 통일.

6) 성능/품질
   - React Server Components 우선, Client 컴포넌트 최소화.
   - Suspense, streaming 사용. useMemo/useCallback/virtual list 검토.
   - ESLint/Prettier/TS strict, 유닛/통합 테스트 도입.

산출물:
- 변경된 폴더 구조 제안, 마이그레이션 계획, 주요 API/훅/컴포넌트 설계도, 적용 PR 계획.
- 리스크/롤백 전략, 커밋 단위, 릴리즈 노트 템플릿.
```

---

# 2) 폴더 구조/모듈화 프롬프트

```
GSRC81 MAPS의 폴더 구조를 아래 원칙으로 재설계해줘:
- /app: 라우팅. public(사용자)와 admin(관리자) 분리.
- /components: dumb UI. shadcn/ui + map components
- /features: 페이지 단위에 가까운 도메인 묶음(map, course-detail, comments, notes, auth)
- /lib: db(client), auth, storage, gpx, distance, rls-helpers
- /data-access: Supabase 쿼리 함수(코스/카테고리/노트/댓글/사진/로그인)
- /types: 도메인 타입과 zod 스키마
- /tests: unit/integration/e2e 구조 제안

출력:
- 제안 폴더 트리
- 각 폴더/파일의 책임과 예시 함수 시그니처
- 바꾸면 깨질 수 있는 import 경로와 대응 전략
```

---

# 3) 데이터 접근 레이어 리팩토링 프롬프트

```
아래 스키마를 사용하여 Supabase DAO 함수를 제로부터 설계해줘.
필수 DAO:
- categories: listActive(), getByKey(key)
- courses: list(params), getById(id), create(dto), update(id, dto), softDelete(id)
- notes: listByCourse(courseId), create, update, remove
- comments: listByCourse(courseId, {page,size}), create, update (owner only), softDelete (owner/admin)
- commentPhotos: listByComment, addMany(commentId, filesMeta[]), remove(photoId)
- access: getCurrentUser(), linkKakaoProfile(), requireAuth()
요구:
- 모두 TypeScript, strict 타입
- 런타임 zod 검증
- 에러 모델 통일(AppError)
- 페이지네이션/정렬 대응
- RLS 전제(서버 Σ 클라이언트 분기)
```

---

# 4) GPX 업로드/전처리 프롬프트

```
GPX 업로드 파이프라인을 구현해줘:
- 입력: GPX XML 혹은 이미 파싱된 좌표 배열(lat, lng, ele?, time?)
- 처리: haversine으로 dist 누적(m), stats.totalDistance, stats.elevationGain
- 출력: GPXData {version:"1.1", points[], stats{}}
- 유효성: 좌표 2개 미만 오류, NaN/∞ 거부, 이상치 필터(점프 이동 시 스무딩)
- 성능: O(n) 한 번 순회, GC 최소화
- 테스트: 소수점 오차 허용 범위, 5km 예제 기준 ±1%
- 결과: courses.gpx_data에 저장하는 순수 함수 + 업로드 훅
```

---

# 5) 코스 상세(비행) 리팩토링 프롬프트

```
코스 상세 페이지를 아래로 리팩토링:
- 서버 컴포넌트에서 course + notes 선로드
- 클라이언트 컴포넌트에서 map 렌더, points 기반 비행 애니메이션
- 1km 마커 추출: points.filter(p => Math.abs(p.dist % 1000) < 10)
- 노트 렌더: show_during_animation=true만 타임라인/지도에 표시
- 성능: requestAnimationFrame, offscreen calculations, memoization
- 접근성: 키보드 컨트롤, 스크린리더 설명
- 에러/로딩: Suspense/Skeleton/Boundary
```

---

# 6) 댓글 + 사진 첨부 프롬프트 (카카오 로그인/RLS)

```
댓글/사진 기능을 다음 조건으로 구현해줘:
- 권한: 카카오 로그인 사용자만 작성/수정/삭제 가능. 본인만 수정/삭제(RLS).
- 작성: message + optional images[], images는 signed URL 업로드 후 file_url 저장
- 수정: message 편집 시 edited_at, edit_count++
- 삭제: is_deleted=true, deleted_at, deleted_by=owner or admin
- 표시: is_deleted면 “삭제된 댓글입니다”
- UI: 이미지 그리드(가로 스크롤 or masonry), 정사각 썸네일, 클릭 시 라이트박스
- 보안: 파일 확장자/크기 제한, 이미지 MIME 확인, URL 서명 만료 처리
- 테스트: 권한별 가드, 업로드 실패, 대용량 이미지
```

---

# 7) 관리자 페이지 프롬프트

```
관리자 페이지를 아래 항목으로 구현/보강해줘:
- /admin/courses: 목록(카테고리/활성 필터, 검색), 생성, 수정, 삭제
- /admin/courses/[id]/manage:
  - 기본: title/description/cover_image_url/difficulty/distance_km/active
  - 좌표: start_latitude/longitude (지도에서 픽)
  - GPX: 업로드 → preprocess → gpx_data 저장 미리보기
  - 노트 탭: notes CRUD, 지도 클릭으로 좌표 채우기
  - 댓글 탭(읽기/숨김)
- /admin/categories: CRUD + sort_order
- /admin/access: access_code 생성/비활성, 카카오 사용자 조회
요구:
- 폼은 react-hook-form + zod
- 서버 액션(or route handlers)로 DB mutate
- 토스트/다이얼로그 UX
```

---

# 8) SQL 마이그레이션/정책 프롬프트

```
다음 스키마 차이를 기준으로 마이그레이션 스크립트를 작성해줘:
- 신규 생성: course_comment_photos, 댓글 보강 컬럼(author_user_key, edited_at, edit_count, is_deleted, deleted_at, deleted_by)
- 제거/미사용화: course_points, gpx_coordinates, courses_backup
- 인덱스: GIN on courses.gpx_data, created_at DESC 인덱스
- RLS: comments/photos 정책 (owner or admin)
- 롤백 스크립트 포함
- 안전장치: backup 스키마에 테이블 사본
```

---

# 9) 테스트/품질 프롬프트

```
테스트 전략을 설계/구현해줘:
- 유닛: gpx preprocess, distance 계산, 코멘트 권한 검사 헬퍼
- 통합: DAO 함수(Supabase emulator), 코스 조회/등록/수정/삭제
- E2E: 주요 사용자 플로우(로그인 → 코스 보기 → 비행 → 댓글/사진)
- 커버리지 목표: lines 80%+, critical path 90%+
- CI: lint/tsc/test, preview deploy
- 성능: Lighthouse, TTI/INP, hydration minimization
```

---

# 10) 코드 리뷰 체크리스트 프롬프트

```
PR 리뷰 체크리스트를 만들어줘:
[스키마] 단일 소스(gpx_data)만 사용? dist 포함?
[도메인] 타입/스키마(zod) 일치? any/unknown 제거?
[보안] RLS/권한 가드, 입력 검증, XSS 방지?
[업로드] signed URL 흐름, 파일 검증, 공개 범위?
[접근성] 키보드 내비, 라벨/대체텍스트, 대비
[성능] RSC 우선, 메모/가상화, 이미지 최적화
[UX] 로딩/에러/빈상태, 토스트/다이얼로그, 되돌리기
[테스트] 유닛/통합/E2E, 임계경로 커버리지
[회귀] 레거시 코드 삭제 여부, 중복 제거, TODO 해소
[문서] README/ENV/마이그레이션 노트 갱신
```

---

## 사용 팁

- 한 번에 모든 걸 바꾸지 말고 **PR 단위를 작게**: “데이터 레이어 → GPX → 상세/비행 → 댓글/사진 → 관리자” 순.
- 각 프롬프트에 **레포의 실제 파일 경로**(예: `src/app/map/page.tsx`)와 **현행 코드 조각**을 포함하면 정확도가 크게 올라가.
- “PDF 기능 삭제 금지” 문구를 항상 프롬프트 상단에 넣어 안전 장치를 유지해.

필요하면 위 프롬프트들을 **레포 전용 README_DEV.md**로 묶어 드릴게.
