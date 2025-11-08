import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ANON 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, file_url, caption } = body;

    console.log('📸 Creating temp course photo record:', {
      course_id,
      file_url: file_url?.substring(0, 50) + '...',
      caption
    });

    // 임시로 course_comment_photos 테이블에 저장 (comment_id는 course_id로 사용)
    const { data, error } = await supabaseClient
      .from("course_comment_photos")
      .insert({
        comment_id: course_id, // course_id를 comment_id로 저장
        file_url,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Temp course photo insert error:', error);
      return NextResponse.json(
        { error: `사진 레코드 생성 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // course_photos 형태로 변환하여 반환
    const coursePhoto = {
      id: data.id,
      course_id: data.comment_id,
      file_url: data.file_url,
      caption: caption || "",
      created_at: data.created_at
    };

    return NextResponse.json(coursePhoto);
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
      .from("course_comment_photos")
      .select("*")
      .eq("comment_id", courseId) // course_id를 comment_id로 검색
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Temp course photos fetch error:', error);
      return NextResponse.json(
        { error: `사진 목록 조회 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // course_photos 형태로 변환
    const coursePhotos = (data || []).map(item => ({
      id: item.id,
      course_id: item.comment_id,
      file_url: item.file_url,
      caption: "",
      created_at: item.created_at
    }));

    return NextResponse.json(coursePhotos);
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
      .from("course_comment_photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      console.error('Temp course photo delete error:', error);
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