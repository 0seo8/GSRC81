# GSRC81 Maps 문서 구조 가이드

## 📚 문서 체계

### 🎯 메인 문서 (최신)
- **PAGE_SPECIFICATIONS_V3.0_FINAL.md** ⭐
  - GSRCmaps2.pdf 공식 디자인 기획서 반영
  - 모든 최신 사양 포함
  - **이 문서를 기준으로 개발 진행**

### 📂 히스토리 문서 (참고용)
- **PAGE_SPECIFICATIONS.md** (v1.0)
  - 초기 기획 버전
  - 기본 페이지 구조와 기능 정의
  
- **PAGE_SPECIFICATIONS_V2.md** (v2.0)
  - 비행모드, 웨이포인트 추가
  - 사진 업로드 초기 설계

- **PAGE_SPECIFICATIONS_V2.3_FINAL.md** (v2.3)
  - 통합 기능 정리
  - V3.0 이전 최종 버전

### 🔧 기술 문서
- **CLAUDE.md**
  - Claude AI 개발 가이드
  - 프로젝트 구조 및 개발 명령어

- **migration_v2.sql**
  - 데이터베이스 마이그레이션 스크립트
  - 테이블 구조 및 RLS 정책

- **GPX_DATA_RESTRUCTURING_PROPOSAL.md**
  - GPX 데이터 통합 제안
  - JSONB 구조 설계

- **MIGRATION_STRATEGY_FINAL.md**
  - 마이그레이션 전략
  - View + Feature Flag 접근법

### 📊 설계 문서
- **database-erd.md**
  - 데이터베이스 ERD
  - 테이블 관계도

- **prd.md**
  - Product Requirements Document
  - 비즈니스 요구사항

- **SERVICE_PLANNING_CURRENT.md**
  - 서비스 기획 현황
  - 개발 우선순위

### 📁 schemas/
- **unified-gpx-schema.ts**
  - TypeScript GPX 데이터 스키마
  - Zod 검증 규칙

---

## 🚀 개발 시작 가이드

### 1. 먼저 읽어야 할 문서
1. **PAGE_SPECIFICATIONS_V3.0_FINAL.md** - 전체 기획 이해
2. **CLAUDE.md** - 개발 환경 설정
3. **migration_v2.sql** - DB 구조 파악

### 2. 기능별 참고 문서
- **랜딩/로그인**: V3.0 섹션 1.1, 1.2
- **지도 기능**: V3.0 섹션 1.3, 1.4, 1.5
- **비행모드**: V3.0 섹션 4
- **사진 업로드**: V3.0 섹션 5
- **댓글 시스템**: V3.0 섹션 6

### 3. 디자인 시스템
- **다크 모던 테마**: V3.0 섹션 🎨
- **컬러 팔레트**: 네온 라임(#B8FF3A), 시그널 오렌지(#FF6F3D)
- **타이포그래피**: SUIT/Pretendard

---

## 📝 문서 관리 원칙

### DO ✅
- V3.0_FINAL을 메인 레퍼런스로 사용
- 새로운 기능은 V3.0에 추가
- 변경사항은 V3.0 섹션 9에 기록

### DON'T ❌
- 이전 버전 문서 직접 수정 금지
- 히스토리 문서 삭제 금지
- V3.0과 충돌하는 내용 작성 금지

---

## 🔄 업데이트 이력

| 버전 | 날짜 | 주요 변경사항 |
|------|------|--------------|
| v1.0 | 2024-10 | 초기 기획 |
| v2.0 | 2024-11 | 비행모드, 웨이포인트 추가 |
| v2.3 | 2024-12 | 사진 업로드 추가 |
| **v3.0** | **2025-01** | **GSRCmaps2.pdf 반영, 다크 모던 디자인** |

---

**최종 수정**: 2025-01-06
**슬로건**: "RUN OUR ROUTE, MAKE YOUR STORY"