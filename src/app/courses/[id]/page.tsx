import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { supabase } from "@/lib/supabase";
import { ChatBubbleList } from "@/components/chat/chat-bubble-list";
import { CourseDetailMapClient } from "@/components/course-detail-map-client";
import { Course } from "@/types";

interface CourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Failed to load course:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to load course:", error);
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-4">
          <CourseDetailMapClient courseId={course.id} />

          {/* <div className="bg-white rounded-lg shadow-sm">
            <ChatBubbleList courseId={course.id} />
          </div> */}
        </div>
      </div>
    </ProtectedRoute>
  );
}
