/**
 * 파일 업로드 제한 상수
 * - 서버 용량 및 성능 고려
 * - 사용자 경험 최적화
 */

// GPX 파일 제한
export const GPX_LIMITS = {
  // 최대 파일 크기 (bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE_MB: 10,

  // 최소 트랙 포인트 수
  MIN_TRACK_POINTS: 10,

  // 허용 확장자
  ALLOWED_EXTENSIONS: [".gpx"] as const,

  // MIME 타입
  MIME_TYPES: ["application/gpx+xml", "text/xml"] as const,
} as const;

// 이미지 파일 제한
export const IMAGE_LIMITS = {
  // 최대 파일 크기 (bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB (4K 사진 지원)
  MAX_FILE_SIZE_MB: 10,

  // 최대 업로드 개수
  MAX_UPLOAD_COUNT: 10,

  // 허용 MIME 타입
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
  ] as const,

  // 사용자 친화적 타입 이름
  ALLOWED_TYPES_DISPLAY: "JPG, PNG, WebP, HEIC" as const,
} as const;

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf("."));
}
