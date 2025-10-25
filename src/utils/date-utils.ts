/**
 * 시간을 상대적 표현으로 변환하는 유틸리티
 * 3일 이내: "1시간 전", "1일 전", "3일 전"
 * 3일 이후: "MM/DD" 형태로 날짜 표시
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  // 3일 이내
  if (diffInDays <= 3) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (diffInMinutes < 1) {
        return "방금 전";
      }
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      return `${diffInDays}일 전`;
    }
  }

  // 3일 이후는 날짜로 표시
  return date.toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
}