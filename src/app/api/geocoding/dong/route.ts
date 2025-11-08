import { NextRequest, NextResponse } from "next/server";

// 카카오 지오코딩 API로 좌표 -> 동 추출
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat, lng 파라미터가 필요합니다." },
        { status: 400 },
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "올바른 좌표 값이 필요합니다." },
        { status: 400 },
      );
    }

    // 맵박스 역지오코딩 API 호출 (좌표 -> 주소)
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      return NextResponse.json(
        { error: "맵박스 API 키가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&language=ko&types=neighborhood,locality,place`,
    );

    if (!response.ok) {
      throw new Error(`맵박스 API 오류: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { error: "해당 좌표의 주소 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 맵박스에서 동 이름 추출 시도
    const feature = data.features[0];
    let dong = null;
    let fullAddress = "";

    // 맵박스 결과에서 동 이름 추출 (한국 지역의 경우)
    if (feature.place_name) {
      fullAddress = feature.place_name;
      
      // 한국 주소 패턴에서 동 이름 추출 시도
      const koreanPattern = /([가-힣]+동)/;
      const match = fullAddress.match(koreanPattern);
      if (match) {
        dong = match[1];
      } else {
        // 동이 없으면 첫 번째 지역명 사용
        const parts = fullAddress.split(',').map(s => s.trim());
        dong = parts[0];
      }
    }

    if (!dong) {
      return NextResponse.json(
        { error: "동 정보를 추출할 수 없습니다." },
        { status: 404 },
      );
    }

    // 동 이름 정규화
    const normalizedDong = dong.includes('동') ? dong : dong + '동';

    return NextResponse.json({
      dong: normalizedDong,
      fullAddress,
      details: {
        region1: "서울특별시", // 맵박스에서는 상세 구분이 어려우므로 서울로 고정
        region2: "은평구", // 프로젝트가 은평구 중심이므로 고정
        region3: normalizedDong,
        roadAddress: fullAddress,
        jibunAddress: fullAddress,
      },
    });
  } catch (error) {
    console.error("동 추출 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}