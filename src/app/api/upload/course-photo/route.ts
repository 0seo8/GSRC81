import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ANON 키를 사용 (버킷이 Public이므로 가능)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase config check:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  anonKey: supabaseAnonKey ? `Set (${supabaseAnonKey.length} chars)` : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey
  });
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  console.log('🔄 Upload API called');
  
  try {
    const body = await request.json();
    const { fileName, fileData, fileType } = body;
    
    console.log('📁 File received:', {
      fileName,
      fileType,
      dataLength: fileData?.length
    });
    
    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: "파일 데이터가 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // Base64 데이터를 Buffer로 변환
    const base64Data = fileData.split(',')[1]; // data:image/png;base64, 부분 제거
    const buffer = Buffer.from(base64Data, 'base64');

    // 파일 타입 검증
    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }
    
    // 버킷 존재 확인은 건너뛰고 바로 업로드 시도
    // 만약 course-photos 버킷이 없다면 Supabase 대시보드에서 수동으로 생성해야 함

    // 파일 업로드
    console.log('Attempting to upload file:', fileName);
    const { error } = await supabaseClient.storage
      .from('course-files') // 정책이 있는 course-files 사용
      .upload(fileName, buffer, { 
        contentType: fileType,
        upsert: false 
      });

    if (error) {
      console.error('Upload error details:', {
        message: error.message,
        error: error,
        fileName: fileName,
        fileSize: buffer.length,
        fileType: fileType
      });
      return NextResponse.json(
        { error: `업로드 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // Public URL 생성
    const { data: { publicUrl } } = supabaseClient.storage
      .from('course-files') // 동일한 버킷 사용
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}