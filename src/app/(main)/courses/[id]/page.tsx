import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import Image from "next/image";
import { Noto_Sans } from "next/font/google";
import { getCourseById } from "@/lib/courses-data";
import { CourseCommentsList } from "@/components/course-comments-list";
import { getCourseComments } from "@/lib/comments";
import { type CoursePhoto } from "@/lib/course-photos";
import { CourseDetailMapWrapper } from "@/components/map/course-detail-map-wrapper";

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

// 서버 컴포넌트로 변경
export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  // 서버에서 params를 직접 await
  const { id: courseId } = await params;

  // 서버에서 데이터 병렬 fetching
  const [course, comments, photosResponse] = await Promise.all([
    getCourseById(courseId).catch(() => null),
    getCourseComments(courseId).catch(() => []),
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/api/course-photos?course_id=${courseId}`
    )
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []),
  ]);

  // 코스가 없으면 404
  if (!course) {
    notFound();
  }

  const photos: CoursePhoto[] = photosResponse || [];

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen ${notoSans.className}`}
        style={{ backgroundColor: "#F5F5F5" }}
      >
        {/* 상단 지도 영역 - 헤더 공간 확보 */}
        <div className="w-full h-[24.5625rem] pt-14 p-2.5">
          <CourseDetailMapWrapper courseId={courseId} />
        </div>

        {/* 하단 컨텐츠 */}
        <div
          className="flex-1"
          style={{
            backgroundColor: "#F5F5F5",
            minHeight: "calc(100vh - 393px)",
          }}
        >
          <div className="overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto px-[10px] py-5">
              {/* 코스 정보 섹션 */}
              <div className="">
                <div className="mb-6 flex justify-between items-end">
                  <h1 className="text-course-detail-title text-black flex-1">
                    {course.title
                      .split(" ")
                      .map((word, index, array) => {
                        const midIndex = Math.ceil(array.length / 2);
                        if (index === midIndex - 1 && array.length > 1) {
                          return word + "\n";
                        }
                        return word + (index < array.length - 1 ? " " : "");
                      })
                      .join("")
                      .split("\n")
                      .map((line, lineIndex) => (
                        <div key={lineIndex}>{line}</div>
                      ))}
                  </h1>
                  <div className="text-right ml-4">
                    <div className="text-xs font-medium text-black">BY</div>
                    <div className="text-xs font-medium text-black">GSRC81</div>
                  </div>
                </div>

                {/* 통계 정보 */}
                <div className="grid grid-cols-4 gap-4 px-2 pt-4 pb-5 border-t border-b border-black text-xs  text-black text-center">
                  <div className="">
                    <div className="mb-2 font-semibold">거리</div>
                    <div className="">{course.distance_km}km</div>
                  </div>
                  <div>
                    <div className="mb-2 font-semibold">시간</div>
                    <div className="">약 {course.avg_time_min || 30}분</div>
                  </div>
                  <div>
                    <div className="mb-2 font-semibold">고도</div>
                    <div className="">{course.elevation_gain || 32}m</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">난이도</div>
                    <div className="">
                      {course.difficulty === "easy"
                        ? "쉬움"
                        : course.difficulty === "medium"
                          ? "보통"
                          : "어려움"}
                    </div>
                  </div>
                </div>

                {/* 코스 설명 */}
                <div className="space-y-2 px-2">
                  <div className="text-course-detail-description text-black pt-5 pb-6">
                    {course.detail_description ||
                      "진관천을 한 바퀴 왕복해 도는 코스입니다. 정기런 때 뛰는 코스이기도 해요! 접근하기 좋아 자주 벙이 열리는 장소입니다. 모두 같이 즐겁게 달려봐요!"}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="bg-white overflow-hidden ">
                        <Image
                          src={photo.file_url}
                          alt={photo.caption || "코스 사진"}
                          width={400}
                          height={400}
                          className="w-full aspect-square object-cover"
                        />
                        {photo.caption && (
                          <div className="p-3">
                            <p className="text-sm text-gray-600">
                              {photo.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
