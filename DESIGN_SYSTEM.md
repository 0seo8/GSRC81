# GSRC81 Maps - Design System Guide

> **"RUN OUR ROUTE, MAKE YOUR STORY."**
> GSRC81의 러닝 코스 공유 앱 디자인 시스템 가이드

---

## 📱 Overview

GSRC81 Maps는 러닝 크루의 코스를 공유하고 커뮤니티를 형성하는 모바일 앱입니다.
디자인은 **미니멀리즘**, **볼드한 타이포그래피**, **컬러 코딩 시스템**을 중심으로 구성되어 있습니다.

---

## 🎨 Color Palette

tnwjd

### Primary Background

- **Light Gray**: `#E8E4DF` / `rgb(232, 228, 223)`
  - 주요 배경색으로 사용
  - 부드럽고 따뜻한 뉴트럴 톤

### Category Color System

각 러닝 카테고리는 고유한 브랜드 컬러를 가집니다:

#### 진관동 러닝 (Jingwan-dong Running)

- **Neon Yellow**: `#E8FF00` (추정)
  - 가장 활기찬 카테고리
  - 정기런의 메인 코스

#### 트랙 러닝 (Track Running)

- **Terracotta Brown**: `#A67C6D` (추정)
  - 안정적이고 전통적인 느낌
  - 트랙 달리기의 클래식한 이미지

#### 트레일 러닝 (Trail Running)

- **Sage Green**: `#7A9B8E` (추정)
  - 자연친화적인 느낌
  - 산악 코스와 연결

#### 로드 러닝 (Road Running)

- **Warm Gray**: `#B8B0A8` (추정)
  - 도시적이고 실용적인 느낌

### Accent Colors

- **Black**: `#000000`
  - 타이틀, 거리 숫자, 아이콘
- **White**: `#FFFFFF`
  - 카드 배경, 버튼 텍스트
- **Map Gray**: `rgba(0,0,0,0.1)` (반투명)
  - 지도 베이스 레이어

---

## 🔤 Typography

### Font Family

- **Primary**: System Font (iOS: SF Pro / Android: Roboto)
  - 한글: **본고딕 (Noto Sans KR)** 또는 시스템 기본
  - 영문: **Futura Bold** 계열 (브랜드 로고용)

### Font Sizes & Weights

#### Display - Distance Numbers

```css
font-size: 96px - 120px
font-weight: 900 (Black)
color: #000000
/* 예: "5 km", "24 km" */
```

#### Heading 1 - Category Titles

```css
font-size: 48px - 64px
font-weight: 900 (Black)
color: #000000
line-height: 1.1
/* 예: "진관동 러닝", "RUN" */
```

#### Heading 2 - Course Names

```css
font-size: 20px - 24px
font-weight: 700 (Bold)
color: #000000
/* 예: "구파발천 정기런" */
```

#### Body - Descriptions

```css
font-size: 14px - 16px
font-weight: 400 (Regular)
color: #000000
line-height: 1.5
/* 본문 설명 텍스트 */
```

#### Caption - Metadata

```css
font-size: 12px - 14px
font-weight: 500 (Medium)
color: rgba(0,0,0,0.6)
/* "로드 러닝 코스", "쉬움" */
```

---

## 📐 Layout & Spacing

### Grid System

- **Container Padding**: 24px (좌우)
- **Card Padding**: 24px (내부)
- **Card Radius**: 24px - 32px
- **Card Spacing**: 16px (카드 간격)

### Breakpoints

```
Mobile: 375px (iPhone SE)
Standard: 390px (iPhone 14)
Large: 430px (iPhone 14 Pro Max)
```

---

## 🧩 UI Components

### 1. Hero Section (Splash)

```
배경: #E8E4DF
텍스트:
  - "RUN" (Black, 72px)
  - "OUR ROUTE," (Black, 48px)
  - "MAKE" (Black, 48px)
  - "YOUR STORY." (Black, 48px)
애니메이션: 텍스트 순차적 페이드인
```

### 2. Logo System

```
Primary Logo:
  - "GSRC81" (손글씨 스타일, 브러시 텍스처)
  - 위치: 중앙 정렬
  - 하단 텍스트: "MAPS" (Black, Bold)

Secondary Mark:
  - "GSRC81 MAPS" (텍스트만, 헤더용)
  - Font-weight: 900
```

### 3. Login Card

```
배경: White (#FFFFFF)
Radius: 24px
Shadow: 0 4px 24px rgba(0,0,0,0.08)

Button:
  - 배경: #FEE500 (카카오 옐로우)
  - 텍스트: "카카오톡 계정으로 계속하기"
  - Radius: 12px
  - Height: 56px
```

### 4. Course Cards (핵심 컴포넌트)

```html
<CourseCard>
  배경색: 카테고리 색상 (Yellow/Green/Brown/Gray) Border-radius: 24px Padding:
  24px

  <title>구파발천 정기런</title>
  <Metadata> 로드 러닝 코스 쉬움 </Metadata>
  <Distance>5 km</Distance>
  <!-- 우측 하단, 96px -->
</CourseCard>
```

**카드 스택 애니메이션:**

- 최대 5개 카드가 오버랩되어 표시
- Y축 오프셋: 각 카드당 +180px
- Z-index: 역순 (상위 카드가 아래 깔림)
- 스크롤 시 상단 카드가 올라가며 다음 카드 노출

### 5. Map View

```
Provider: Mapbox GL
Style: Light (베이지/그레이 톤)
Markers:
  - 검정 Pin (숫자 표시)
  - 선택 시: 빨강/민트/브라운으로 변경

Controls:
  - 현위치 버튼 (우측 상단, 흰 배경)
  - MENU 버튼 (우측 상단)
```

### 6. Detail Sheet (Bottom Sheet)

```
배경: White
Top Handle: 회색 바 (중앙)
Radius: 24px 24px 0 0

Content:
  - 코스 제목 (24px, Bold)
  - Mapbox 미니맵 (16:9 비율)
  - 메타데이터 테이블
    | 거리 | 시간 | 고도 | 난이도 |
    | 5km | 약 30분 | 32m | 쉬움 |

  - 설명 텍스트 (2열 레이아웃)
  - 댓글 섹션 (프로필 + 말풍선)
  - 단체 사진 (전체 너비)
```

### 7. Comment Bubbles

```
구조:
  <Avatar> 원형, 48px
  <Bubble>
    배경: Black (#000000)
    텍스트: White
    Radius: 16px 16px 16px 0 (왼쪽 하단 직각)
    Padding: 12px 16px
  </Bubble>

  <Metadata>
    이름 + 거리 + 시간
    예: "김영식 0km 3일 전"
  </Metadata>

레이아웃:
  - 좌측/우측 교대 배치
  - Avatar 위치로 화자 구분
```

### 8. Category Filter (Bottom)

```
배경: 반투명 카드 스택 프리뷰
위치: 화면 하단 1/3
스크롤: 수평 스냅 스크롤

상태 변화:
  선택 시 → 카테고리 색상으로 맵 마커 변경
  맵 필터 → 해당 카테고리만 표시
```

---

## 🎭 Interaction Patterns

### Gestures

1. **수직 스크롤**: 카드 스택 네비게이션
2. **수평 스크롤**: 카테고리 필터링
3. **핀치 줌**: 지도 확대/축소
4. **탭**: 카드 선택 → 상세 보기
5. **드래그 업**: Bottom Sheet 확장

### Animations

```javascript
// 카드 스택 트랜지션
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)

// Bottom Sheet
transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)

// 맵 마커 변경
transition: all 0.2s ease-in-out
```

### States

- **Default**: 기본 카테고리 색상
- **Hover**: 카드 약간 상승 (shadow 증가)
- **Active**: 선택된 카드 강조 (테두리 추가)
- **Disabled**: 투명도 50%

---

## 🗺️ Map Integration

### Mapbox Style

```json
{
  "style": "mapbox://styles/mapbox/light-v11",
  "customizations": {
    "land": "#EDE9E4",
    "water": "#B8D4E8",
    "park": "#C8D9C0",
    "building": "#D5D0CB"
  }
}
```

### Marker Design

```
기본 핀:
  - 색상: Black
  - 크기: 32x40px
  - 내부 숫자: White, 16px Bold

선택 시:
  - 색상: 카테고리 색상
  - 크기: 40x50px (20% 확대)
  - 애니메이션: 바운스 효과
```

---

## 📱 Screen Breakdown

### 1. Splash (Pages 1-5)

- 브랜드 슬로건 순차 표시
- 배경: 베이지 단색
- 애니메이션 후 → Login

### 2. Login (Pages 6-7)

- 로고 애니메이션
- 카카오 로그인 버튼
- 약관 동의 텍스트

### 3. Map List (Pages 8-13)

- 상단: 지도 (50%)
- 하단: 카드 스택 (50%)
- 카테고리별 필터링 가능

### 4. Detail View (Pages 17-21)

- 전체 화면 Bottom Sheet
- 지도 미니맵
- 코스 정보 테이블
- 댓글 섹션
- 단체 사진

---

## 🎯 Design Principles

### 1. Content-First

- 거리 숫자를 가장 크게 표시
- 정보 계층을 명확하게 구분

### 2. Bold & Simple

- 극대화된 타이포그래피
- 미니멀한 UI 요소
- 충분한 여백

### 3. Category-Driven

- 색상으로 카테고리 즉시 인식
- 일관된 컬러 코딩 시스템

### 4. Community-Oriented

- 댓글 기능 강조
- 단체 사진으로 커뮤니티 느낌
- 사용자 활동 표시 ("0km 3일 전")

---

## 🔧 Implementation Notes

### CSS Variables

```css
:root {
  /* Colors */
  --bg-primary: #e8e4df;
  --color-jingwan: #e8ff00;
  --color-track: #a67c6d;
  --color-trail: #7a9b8e;
  --color-road: #b8b0a8;

  /* Typography */
  --font-size-display: 96px;
  --font-size-h1: 64px;
  --font-size-h2: 24px;
  --font-size-body: 16px;
  --font-size-caption: 14px;

  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Radius */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
}
```

### Component Structure (React)

```typescript
// 권장 컴포넌트 구조
/components
  /common
    - Button.tsx
    - Card.tsx
    - Avatar.tsx
  /course
    - CourseCard.tsx
    - CourseList.tsx
    - CourseDetail.tsx
  /map
    - MapView.tsx
    - MapMarker.tsx
  /comment
    - CommentBubble.tsx
    - CommentList.tsx
```

---

## 📚 Assets Needed

### Icons

- 현위치 아이콘
- 메뉴 아이콘 (햄버거)
- 핀 마커
- 카카오톡 로고

### Images

- GSRC81 브러시 로고
- 단체 사진 placeholder
- 사용자 프로필 placeholder

### Fonts

- Noto Sans KR (Regular, Medium, Bold, Black)
- Futura Bold (로고용)

---

## 🎨 Figma Tips

이 디자인을 Figma로 재현할 때:

1. **Auto Layout 활용**
   - 카드는 모두 Auto Layout으로 구성
   - Padding: 24px, Gap: 16px

2. **Component 만들기**
   - CourseCard를 메인 컴포넌트로
   - Variant: category (4가지)

3. **Color Styles 정의**
   - 모든 카테고리 색상을 Style로 등록
   - 다크모드 대응 가능하도록

4. **Text Styles**
   - Display, H1, H2, Body, Caption 정의
   - 일관성 유지

---

## ✅ Accessibility

- **Contrast Ratio**:
  - 텍스트/배경 최소 4.5:1 유지
  - 대형 텍스트(24px+)는 3:1 이상

- **Touch Targets**:
  - 최소 44x44px (iOS 권장)
  - 버튼 간 최소 8px 간격

- **Screen Reader**:
  - 모든 이미지에 alt 텍스트
  - 의미 있는 순서로 콘텐츠 구성

---

## 📝 Version History

- **v1.0** (2025-01-25): 초기 디자인 시스템 문서화
- 기반: Figma PDF 분석

---

**Designed by GSRC81 Team**
_Run our route, make your story._
