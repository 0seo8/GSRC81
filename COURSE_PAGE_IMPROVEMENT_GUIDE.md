# 📋 Course/[id] 페이지 개선 가이드

> **목표**: 현재 구현을 PDF 시안(19-23페이지)과 일치하도록 개선

## 🎯 **현재 구현 vs PDF 시안 차이점 분석**

### 📊 **주요 발견사항**

- **현재 구현률**: 약 70% 완성
- **핵심 기능**: 지도 위 댓글 말풍선 **이미 구현됨** ✅
- **주요 차이점**: 색상, 레이아웃, 크기 조정 필요

---

## 🔧 **Phase 1: 즉시 수정 (1시간 이내)**

### 1. 지도 말풍선 색상 변경

**파일**: `src/components/course-detail-map.tsx:591`

```typescript
// 현재: 흰색 말풍선
- <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 relative">

// 변경: 검은색 말풍선 (PDF 시안과 일치)
+ <div className="bg-black text-white rounded-lg shadow-lg p-3 relative">
```

**예상 시간**: 5분

### 2. 지도 높이 확대

**파일**: `src/app/(main)/courses/[id]/page.tsx:116`

```typescript
// 현재: 화면의 50%
- <div className="h-[65vh] relative">

// 변경: 화면의 70% (전체 화면 느낌)
+ <div className="h-[70vh] relative">
```

**예상 시간**: 5분

### 3. 통계 그리드 2x2 배치

**파일**: `src/app/(main)/courses/[id]/page.tsx:130`

```typescript
// 현재: 4열 가로 배치
- <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-200">

// 변경: 2x2 그리드 (가독성 향상)
+ <div className="grid grid-cols-2 grid-rows-2 gap-4 py-4 border-b border-gray-200">
```

**예상 시간**: 10분

### 4. 작성자 정보 상단 이동

**파일**: `src/app/(main)/courses/[id]/page.tsx:125, 168-172`

```typescript
// 기존 코드 제거 (168-172줄)
- <div className="flex items-center justify-end text-sm text-gray-500">
-   <span>BY</span>
-   <span className="ml-1 font-medium">GSRC81</span>
- </div>

// 새로운 위치에 추가 (125줄 교체)
- <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
+ <div className="flex items-center justify-between mb-4">
+   <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
+   <div className="text-sm text-gray-600">
+     <span className="font-medium">BY GSRC81</span>
+   </div>
+ </div>
```

**예상 시간**: 15분

---

## 🎨 **Phase 2: 스타일 개선 (1-2일)**

### 5. 배경색 화이트로 통일

**파일**: `src/app/(main)/courses/[id]/page.tsx:114, 121`

```typescript
// lola-50 커스텀 색상 제거
- <div className="min-h-screen bg-lola-50" style={{ paddingTop: "5rem" }}>
+ <div className="min-h-screen bg-white" style={{ paddingTop: "5rem" }}>

- <div className="flex-1 bg-lola-50">
+ <div className="flex-1 bg-white">
```

**예상 시간**: 20분

### 6. 사진 갤러리 단일 이미지 스타일

**파일**: `src/components/course-gallery.tsx:68-105`

```typescript
// 현재: 2열 그리드
- <div className="grid grid-cols-2 gap-3">

// 변경: 단일 대형 이미지 (PDF 시안 스타일)
+ <div className="space-y-4">
+   {photos.map((photo, index) => (
+     <div key={photo.id} className="w-full">
+       <Image
+         src={photo.file_url}
+         alt={photo.caption || `코스 사진 ${index + 1}`}
+         width={800}
+         height={400}
+         className="w-full h-48 object-cover rounded-lg"
+       />
+     </div>
+   ))}
+ </div>
```

**예상 시간**: 30분

### 7. 바텀 시트 UI 개선

**새 파일**: `src/components/ui/bottom-sheet.tsx`

- 모바일 네이티브 스타일
- 드래그 핸들 추가
- 높이 조절 가능
  **예상 시간**: 45분

---

## 🚀 **Phase 3: 고급 기능 (1주일+)**

### 8. 비행 모드 스타일 개선

**파일**: `src/components/course-detail-map.tsx`

- 현재: 3D 드론 비행
- 개선: 경로 중심 따라가기
- 말풍선과 동기화
  **예상 시간**: 2시간

### 9. 프로필 이미지 시스템

**파일**: `src/components/course-comments-list.tsx:60-64`

- 현재: 이니셜 아바타
- 개선: 실제 사용자 사진
  **예상 시간**: 1시간

### 10. 터치 인터페이스 개선

**전체 UX 개선**

- 스와이프 제스처
- 모바일 최적화
  **예상 시간**: 3시간+

---

## 📈 **우선순위별 로드맵**

### ⚡ **즉시 실행 (35분)**

1. 지도 말풍선 색상 → 검은색
2. 지도 높이 → 70vh
3. 통계 그리드 → 2x2
4. 작성자 위치 → 상단

### 🎯 **단기 목표 (1-2일)**

5. 배경색 → 화이트 통일
6. 사진 갤러리 → 단일 이미지
7. 바텀 시트 → 모바일 스타일

### 🚀 **장기 목표 (1주일+)**

8. 비행 모드 → 경로 중심
9. 프로필 → 실제 사진
10. 터치 UX → 제스처 지원

---

## ✅ **검증 체크리스트**

완료 후 다음 사항을 확인하세요:

- [ ] **지도 말풍선**이 검은색 배경으로 표시
- [ ] **지도 높이**가 화면의 70% 이상 차지
- [ ] **통계 정보**가 2x2 그리드로 배치
- [ ] **작성자 정보**가 상단 헤더에 표시
- [ ] **전체 배경**이 깔끔한 화이트
- [ ] **사진 갤러리**가 단일 대형 이미지 스타일

---

## 📁 **참고 파일 위치**

### 주요 파일

- **메인 페이지**: `src/app/(main)/courses/[id]/page.tsx`
- **지도 컴포넌트**: `src/components/course-detail-map.tsx`
- **댓글 리스트**: `src/components/course-comments-list.tsx`
- **사진 갤러리**: `src/components/course-gallery.tsx`

### 참고 자료

- **PDF 시안**: `GSRC81 MAPS.pdf` (19-23페이지)
- **프로젝트 가이드**: `CLAUDE.md`

---

## 🎯 **핵심 포인트**

### ✅ **이미 잘 구현된 부분**

- 지도 위 댓글 말풍선 기능
- 거리 정보 표시 (0km, 0.9km)
- 실시간 댓글 업데이트
- 애니메이션 효과

### 🔧 **개선 필요 부분**

- 말풍선 색상 (흰색 → 검은색)
- 레이아웃 크기 조정
- 시각적 일관성

### 💡 **개발 팁**

- Phase 1만 완료해도 80% 일치
- 단계별 진행 권장
- 각 수정사항은 독립적으로 적용 가능

---

_📝 작성일: 2025-10-25_
_🎯 목표: PDF 시안 100% 일치_
_⏱️ 예상 총 소요시간: Phase 1 (35분) + Phase 2 (1.5시간) + Phase 3 (6시간+)_
