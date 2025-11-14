import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      course_id,
      message,
      latitude,
      longitude,
      author_nickname = "익명"
    } = body;

    // 필수 필드 검증
    if (!course_id || !message) {
      return NextResponse.json(
        { error: "course_id와 message는 필수입니다." },
        { status: 400 }
      );
    }

    // 메시지 길이 검증
    if (message.length > 200) {
      return NextResponse.json(
        { error: "메시지는 200자 이하로 작성해주세요." },
        { status: 400 }
      );
    }

    // 코스 존재 여부 확인
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "존재하지 않는 코스입니다." },
        { status: 404 }
      );
    }

    // 댓글 삽입 (현재 스키마에 맞춰 기본 필드만 사용)
    const { data: comment, error: insertError } = await supabase
      .from("course_comments")
      .insert({
        course_id,
        author_nickname,
        message: message.trim(),
        // 향후 위치 정보 지원 시 사용할 필드들 (현재는 주석 처리)
        // latitude,
        // longitude,
      })
      .select()
      .single();

    if (insertError) {
      console.error("댓글 삽입 오류:", insertError);
      return NextResponse.json(
        { error: "댓글 저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        comment,
        message: "댓글이 성공적으로 추가되었습니다."
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id");

    if (!courseId) {
      return NextResponse.json(
        { error: "course_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 댓글 목록 조회
    const { data: comments, error } = await supabase
      .from("course_comments")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("댓글 조회 오류:", error);
      return NextResponse.json(
        { error: "댓글 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comments: comments || []
    });

  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}