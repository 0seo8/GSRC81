/**
 * 사용자 메시지 상수 (에러, 성공, 확인 메시지 등)
 */

export const SUCCESS_MESSAGES = {
  COURSE_CREATED: "코스가 성공적으로 등록되었습니다",
  COURSE_UPDATED: "코스가 수정되었습니다",
  COURSE_DELETED: "코스가 삭제되었습니다",
  PASSWORD_UPDATED: "비밀번호가 변경되었습니다",
} as const;

export const ERROR_MESSAGES = {
  COURSE_LOAD_FAILED: "코스를 불러오는 중 오류가 발생했습니다",
  COURSE_CREATE_FAILED: "코스 등록 중 오류가 발생했습니다",
  COURSE_DELETE_FAILED: "코스 삭제 중 오류가 발생했습니다",
  INVALID_GPX_DATA: "GPX 데이터가 유효하지 않습니다",
  INVALID_START_POINT: "시작점 좌표가 유효하지 않습니다",
  INVALID_COORDINATES: "GPS 좌표 데이터가 없습니다",
  INVALID_DISTANCE: "거리 정보가 유효하지 않습니다",
  INVALID_DURATION: "소요시간 정보가 유효하지 않습니다",
  NETWORK_ERROR: "네트워크 오류가 발생했습니다",
} as const;

export const CONFIRM_MESSAGES = {
  DELETE_COURSE: (title: string) => `"${title}" 코스를 삭제하시겠습니까?`,
  RESET_FORM: "작성한 내용이 사라집니다. 계속하시겠습니까?",
} as const;

export const LOADING_MESSAGES = {
  LOADING_COURSES: "코스를 불러오는 중...",
  LOADING_DASHBOARD: "대시보드를 불러오는 중...",
  UPLOADING: "업로드 중...",
  PROCESSING: "처리 중...",
} as const;
