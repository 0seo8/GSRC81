import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ANON 키 사용 (RLS가 비활성화되면 작동)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase config:', {
  url: !!supabaseUrl,
  anonKey: !!supabaseAnonKey
});

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, file_url, caption } = body;

    console.log('📸 Creating course photo record:', {
      course_id,
      file_url: file_url?.substring(0, 50) + '...',
      caption
    });

    const { data, error } = await supabaseClient
      .from("course_photos")
      .insert({
        course_id,
        file_url,
        caption: caption || "",
      })
      .select()
      .single();

    if (error) {
      console.error('Course photo insert error:', error);
      return NextResponse.json(
        { error: `사진 레코드 생성 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json(
        { error: "course_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseClient
      .from("course_photos")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Course photos fetch error:', error);
      return NextResponse.json(
        { error: `사진 목록 조회 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photo_id');

    if (!photoId) {
      return NextResponse.json(
        { error: "photo_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabaseClient
      .from("course_photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      console.error('Course photo delete error:', error);
      return NextResponse.json(
        { error: `사진 삭제 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}