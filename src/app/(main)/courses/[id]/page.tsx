import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { getCourseById, getCourses } from "@/shared/lib/courses-data";
import { CourseCommentsList } from "@/features/courses/components/course-comments-list";
import { getCourseComments } from "@/shared/lib/comments";
import { getCoursePhotos } from "@/shared/lib/course-photos";
import { CourseDetailMapWrapper } from "@/features/map/components/course-detail-map-wrapper";
import { CourseStats } from "@/features/courses/components/course-stats";
import { PhotoGallery } from "@/features/courses/components/photo-gallery";
import { AppHeader } from "@/shared/components/layout/app-header";
import { MenuButton } from "@/shared/components/layout/menu-button";
import { splitTitleAtMidpoint } from "@/shared/lib/utils/text";
import { DEFAULT_COURSE_DESCRIPTION } from "@/core/config/course";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

interface CourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// 빌드 시 정적 페이지 생성 (ISR)
// 모든 코스를 미리 빌드하여 초기 로딩 성능 향상
export async function generateStaticParams() {
  try {
    const courses = await getCourses();
    return courses.map((course) => ({
      id: course.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

// ISR: 1시간마다 재검증
export const revalidate = 3600;

// SEO를 위한 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseById(id).catch(() => null);

  if (!course) {
    return {
      title: "코스를 찾을 수 없습니다 | GSRC81 MAPS",
      description: "요청하신 러닝 코스를 찾을 수 없습니다.",
    };
  }

  return {
    title: `${course.title} | GSRC81 MAPS`,
    description:
      course.detail_description ||
      course.description ||
      `${course.distance_km}km의 ${course.title} 러닝 코스를 지금 확인해보세요.`,
    openGraph: {
      title: course.title,
      description: course.description,
      type: "website",
    },
  };
}

// 서버 컴포넌트로 변경
export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  // 서버에서 params를 직접 await
  const { id: courseId } = await params;

  // 서버에서 데이터 병렬 fetching
  const [course, comments, photos] = await Promise.all([
    getCourseById(courseId).catch(() => null),
    getCourseComments(courseId).catch(() => []),
    getCoursePhotos(courseId).catch(() => []),
  ]);

  // 코스가 없으면 404
  if (!course) {
    notFound();
  }

  // 제목을 중간 지점에서 두 줄로 분할
  const [firstLine, secondLine] = splitTitleAtMidpoint(course.title);

  return (
    <div className={`min-h-screen bg-page-bg ${notoSans.className}`}>
      {/* AppHeader - 로고 + 메뉴 */}
      <AppHeader background="transparent" rightElement={<MenuButton />} />

      {/* 상단 지도 영역 - 헤더 공간 확보 */}
      <div className="w-full h-map-height pt-14 p-2.5">
        <CourseDetailMapWrapper courseId={courseId} />
      </div>

      {/* 하단 컨텐츠 */}
      <div
        className="flex-1 bg-page-bg"
        style={{ minHeight: "calc(100vh - 393px)" }}
      >
        <div className="overflow-y-auto h-full">
          <div className="max-w-2xl mx-auto px-5 py-5">
            {/* 코스 정보 섹션 */}
            <div>
              <div className="mb-6 flex justify-between items-end">
                <h1 className="text-course-detail-title text-black flex-1">
                  <div>{firstLine}</div>
                  {secondLine && <div>{secondLine}</div>}
                </h1>
                <div className="text-right ml-4">
                  <div className="text-xs font-medium text-black">BY</div>
                  <div className="text-xs font-medium text-black">GSRC81</div>
                </div>
              </div>

              {/* 통계 정보 */}
              <CourseStats
                distance={course.distance_km}
                time={course.avg_time_min || 30}
                elevation={course.elevation_gain || 32}
                difficulty={course.difficulty}
              />

              {/* 코스 설명 */}
              <div className="space-y-2">
                <div className="text-course-detail-description text-black pt-5 pb-6">
                  {course.detail_description || DEFAULT_COURSE_DESCRIPTION}
                </div>
              </div>
            </div>

            {/* 댓글 섹션 */}
            <div className="border-t border-black py-6">
              <CourseCommentsList comments={comments} loading={false} />
            </div>

            {/* 코스 사진 갤러리 */}
            {photos.length > 0 && (
              <div className="border-t border-b border-black py-6">
                <PhotoGallery photos={photos} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
