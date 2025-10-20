# GSRC81 MAPS - Figma 기반 디자인 시스템

> **출처**: [Figma Design](https://www.figma.com/design/kOLiZAR3ceVMuyW4abWsHB/GSRC81-MAPS?node-id=1-2062&p=f&t=ElSHAdQ8wUX8NF10-0)
> **분석일**: 2025-01-17
> **기반**: 실제 Figma 디자인 데이터

---

## 🎨 색상 가이드 (Figma 기반)

### Primary Colors

```css
/* 메인 배경색 */
--bg-primary: #ebe7e4; /* fill_2CD7TB - 메인 배경 */
--bg-secondary: #d9d9d9; /* fill_IOCY7O - 지도 배경 */
--bg-overlay: rgba(217, 215, 212, 0.4); /* fill_MYMCD1 - 오버레이 */

/* 텍스트 색상 */
--text-primary: #000000; /* fill_IMUM94 - 기본 텍스트 */
--text-secondary: rgba(0, 0, 0, 0.5); /* fill_GFPZUQ - 보조 텍스트 */
--text-tertiary: #828282; /* fill_RJFCGV - 터셔리 텍스트 */
--text-white: #ffffff; /* fill_QLU3RC - 흰색 텍스트 */
```

### Category Colors (러닝 카테고리별)

```css
/* 트랙 러닝 */
--track-primary: #d04836; /* fill_Y1ABXM - 트랙 러닝 메인 */
--track-secondary: #fcfef2; /* fill_OZJCYM - 트랙 러닝 보조 */

/* 로드 러닝 */
--road-primary: #fcfc60; /* fill_C3B47Z - 로드 러닝 메인 */
--road-secondary: #e0e0e0; /* fill_5G0NOK - 로드 러닝 보조 */

/* 트레일 러닝 */
--trail-primary: #78a893; /* fill_9W2HCU - 트레일 러닝 메인 */
--trail-secondary: #e5e4d4; /* fill_5YMV63 - 트레일 러닝 보조 */

/* 진관동 러닝 */
--jingwan-primary: #697064; /* fill_6QKJ8X - 진관동 러닝 메인 */
--jingwan-secondary: #7a7a7a; /* fill_SI90H0 - 진관동 러닝 보조 */

/* 기타 색상 */
--button-bg: #d8d5d3; /* fill_4RXB1X - 버튼 배경 */
--button-hover: #C3B47Z; /* 버튼 호버 (추정) */
```

### Status & UI Colors

```css
/* 상태 표시 */
--status-bar: #ffffff; /* 상태바 배경 */
--status-icon: #dadada; /* fill_CX0I06 - 상태 아이콘 */

/* 구분선 */
--border-light: rgba(0, 0, 0, 0.5); /* stroke_WZ9EKV - 경계선 */
--border-strong: #000000; /* stroke_10VJTU - 강한 경계선 */
```

---

## 📝 타이포그래피 (Figma 기반)

### Font Families

```css
/* 메인 폰트 */
--font-primary: "Poppins", sans-serif;
--font-secondary: "Noto Sans", sans-serif;
--font-body: "Inter", sans-serif;
```

### Font Sizes & Weights

```css
/* 헤더 */
--text-header: {
  font-family: 'Poppins';
  font-weight: 700;
  font-size: 17px;
  line-height: 1.4;
}

/* 메인 타이틀 */
--text-title: {
  font-family: 'Noto Sans';
  font-weight: 700;
  font-size: 25px;
  line-height: 1.4;
}

/* 카테고리 타이틀 */
--text-category: {
  font-family: 'Noto Sans';
  font-weight: 700;
  font-size: 30px;
  line-height: 1.4;
}

/* 거리 표시 (큰 숫자) */
--text-distance: {
  font-family: 'Poppins';
  font-weight: 600;
  font-size: 70px;
  line-height: 1.4;
  letter-spacing: -5%;
}

/* 코스명 */
--text-course: {
  font-family: 'Noto Sans';
  font-weight: 700;
  font-size: 17px;
  line-height: 1.4;
}

/* 본문 */
--text-body: {
  font-family: 'Noto Sans';
  font-weight: 500;
  font-size: 12px;
  line-height: 1.4;
}

/* 댓글 */
--text-comment: {
  font-family: 'Inter';
  font-weight: 500;
  font-size: 14px;
  line-height: 1.4;
}

/* 버튼 */
--text-button: {
  font-family: 'Inter';
  font-weight: 500;
  font-size: 10px;
  line-height: 1.4;
}

/* 슬로건 */
--text-slogan: {
  font-family: 'Poppins';
  font-weight: 700;
  font-size: 45px;
  line-height: 1.4;
};
```

---

## 📐 간격 시스템 (Figma 기반)

### Spacing Scale

```css
/* 기본 간격 */
--space-xs: 4px; /* 작은 간격 */
--space-sm: 8px; /* 작은 간격 */
--space-md: 16px; /* 중간 간격 */
--space-lg: 24px; /* 큰 간격 */
--space-xl: 32px; /* 매우 큰 간격 */
--space-2xl: 48px; /* 2배 큰 간격 */
--space-3xl: 92px; /* 3배 큰 간격 */

/* 컴포넌트별 간격 */
--padding-button: 8px 16px;
--padding-card: 24px;
--padding-section: 0px 24px;
--margin-comment: 92px;
```

### Layout Dimensions

```css
/* 화면 크기 */
--screen-width: 390px;
--screen-height: 844px;

/* 카드 크기 */
--card-width: 375px;
--card-height: 180px;
--card-height-small: 130px;

/* 버튼 크기 */
--button-width: 327px;
--button-height: 40px;

/* 아바타 크기 */
--avatar-size: 48px;
--avatar-small: 35.36px;
```

---

## 🧩 컴포넌트 디자인 (Figma 기반)

### 1. 카드 컴포넌트

```css
.course-card {
  width: 375px;
  height: 180px;
  border-radius: 45px 45px 0px 0px; /* 첫 번째 카드 */
  border-radius: 45px; /* 마지막 카드 */
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.course-card-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.course-distance {
  font-family: "Poppins";
  font-weight: 600;
  font-size: 70px;
  line-height: 1.4;
  letter-spacing: -5%;
  text-align: right;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

### 2. 댓글 컴포넌트

```css
.comment-bubble {
  padding: 8px 16px;
  border-radius: 18px;
  max-width: 221px;
  background: #ffffff;
}

.comment-bubble-sent {
  border-radius: 0px 18px 18px 18px;
  align-self: flex-start;
}

.comment-bubble-received {
  border-radius: 18px 0px 18px 18px;
  align-self: flex-end;
}

.comment-user {
  font-family: "Inter";
  font-weight: 500;
  font-size: 14px;
  color: #000000;
}

.comment-timestamp {
  font-family: "Inter";
  font-weight: 400;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.5);
}
```

### 3. 버튼 컴포넌트

```css
.button-primary {
  width: 327px;
  height: 40px;
  background: #d8d5d3;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Inter";
  font-weight: 500;
  font-size: 10px;
  color: #000000;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-primary:hover {
  background: #C3B47Z;
}
```

### 4. 상태바 컴포넌트

```css
.status-bar {
  width: 375px;
  height: 44px;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 21px;
}

.status-bar-left {
  width: 54px;
  height: 21px;
  border-radius: 32px;
}

.status-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## 📱 반응형 디자인 (Figma 기반)

### Breakpoints

```css
/* 모바일 우선 */
@media (max-width: 390px) {
  .container {
    width: 100%;
    padding: 0 8px;
  }
}

/* 태블릿 */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}
```

### Layout Patterns

```css
/* 지도 레이아웃 */
.map-container {
  width: 390px;
  height: 844px;
  background: #d9d9d9;
  position: relative;
}

/* 바텀시트 */
.bottom-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ebe7e4;
  border-radius: 24px 24px 0px 0px;
  padding: 24px;
}

/* 카드 스택 */
.card-stack {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.card-stack .card:not(:last-child) {
  border-radius: 45px 45px 0px 0px;
}

.card-stack .card:last-child {
  border-radius: 45px;
}
```

---

## ✨ 애니메이션 (Figma 기반)

### Transitions

```css
/* 기본 전환 */
.transition-base {
  transition: all 0.2s ease-in-out;
}

/* 카드 호버 */
.card-hover {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 버튼 클릭 */
.button-click {
  transition:
    background-color 0.1s,
    transform 0.1s;
}

.button-click:active {
  transform: scale(0.98);
}

/* 페이드 인 */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 슬라이드 업 */
.slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

---

## 🎯 사용 가이드

### 1. 색상 사용법

- **Primary**: 메인 브랜드 색상으로 헤더, 버튼에 사용
- **Category Colors**: 각 러닝 카테고리별로 구분하여 사용
- **Text Colors**: 계층에 따라 primary, secondary, tertiary 사용

### 2. 타이포그래피 사용법

- **Header**: 앱 제목, 섹션 제목
- **Title**: 코스명, 주요 제목
- **Body**: 설명 텍스트, 일반 내용
- **Distance**: 거리 표시용 큰 숫자
- **Comment**: 댓글, 사용자 입력

### 3. 컴포넌트 사용법

- **Card**: 코스 정보 표시, 일관된 스타일 유지
- **Button**: 액션 버튼, 일관된 크기와 스타일
- **Comment**: 사용자 피드백, 구분된 스타일

### 4. 반응형 고려사항

- **모바일 우선**: 390px 기준으로 설계
- **터치 친화적**: 최소 44px 터치 영역
- **가독성**: 충분한 대비와 크기

---

## 📋 체크리스트

### 개발 시 확인사항

- [ ] 색상 값이 Figma와 정확히 일치하는지 확인
- [ ] 폰트 패밀리와 크기가 일치하는지 확인
- [ ] 간격과 패딩이 디자인과 일치하는지 확인
- [ ] 컴포넌트 스타일이 일관성 있게 적용되었는지 확인
- [ ] 반응형 레이아웃이 올바르게 작동하는지 확인
- [ ] 애니메이션이 부드럽게 작동하는지 확인

### 디자인 검수

- [ ] 전체적인 색상 조화
- [ ] 타이포그래피 계층 구조
- [ ] 컴포넌트 일관성
- [ ] 사용자 경험 흐름
- [ ] 접근성 고려사항

---

**이 디자인 시스템은 실제 Figma 디자인을 기반으로 작성되었으며, 개발 시 정확한 구현을 위한 가이드입니다.**
