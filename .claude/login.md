유저플로우에서 **“카카오 로그인 + 최초 1회 접근코드 인증 → 이후 자동 로그인”**

아래는 바로 IDE에 붙여 넣고 개발할 수 있는
💥 **완성형 Next.js + Supabase + Kakao OAuth 통합 프롬프트 세트**입니다.

---

# 🧭 **1️⃣ 개요 — 목표 구조**

```mermaid
graph TD
A[로그인 버튼 클릭] --> B[카카오 OAuth 인증]
B --> C[/api/auth/kakao/callback]
C --> D{DB에 kakao_user_id 존재?}
D -- ❌ 없음 --> E[verify 페이지로 이동 (access_code 입력)]
E --> F[access_links.upsert(kakao_user_id + access_code)]
D -- ✅ 존재 --> G[자동 로그인 → /map]
```

---

# ⚙️ **2️⃣ 환경 변수 (.env.local)**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

NEXT_PUBLIC_KAKAO_CLIENT_ID=<카카오 REST API 키>
NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/kakao/callback
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
```

> ⚠️ `REDIRECT_URI`는 반드시 카카오 개발자 콘솔에도 동일하게 등록해야 합니다.
> 예: `https://localhost:3000/api/auth/kakao/callback` (로컬)
> 예: `https://gsrc81.vercel.app/api/auth/kakao/callback` (프로덕션)

---

# 💬 **3️⃣ /login — 로그인 페이지**

```tsx
// /app/login/page.tsx
"use client";

export default function LoginPage() {
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <img src="/logo.svg" alt="GSRC81 MAPS" className="w-28 mb-6" />
      <button
        onClick={handleKakaoLogin}
        className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-6 rounded-full shadow-md"
      >
        카카오로 로그인
      </button>
    </main>
  );
}
```

---

# 🔐 **4️⃣ /api/auth/kakao/callback — 로그인 콜백**

```ts
// /app/api/auth/kakao/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect("/login?error=no_code");

  // 1️⃣ 카카오 OAuth 토큰 요청
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI!,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  const kakaoAccessToken = tokenData.access_token;

  // 2️⃣ 유저 정보 가져오기
  const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${kakaoAccessToken}` },
  });
  const userData = await userRes.json();
  const { id, properties } = userData;
  const nickname = properties?.nickname ?? "Kakao User";
  const profileUrl = properties?.profile_image ?? null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3️⃣ access_links에서 기존 유저 확인
  const { data: existingUser } = await supabase
    .from("access_links")
    .select("*")
    .eq("kakao_user_id", id.toString())
    .single();

  if (!existingUser) {
    // 최초 로그인 → 접근 코드 입력 페이지로 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/verify?uid=${id}`
    );
  }

  if (!existingUser.is_active) {
    return NextResponse.redirect("/login?error=not_active");
  }

  // 4️⃣ 이미 등록된 유저 → 바로 로그인 성공
  return NextResponse.redirect("/map");
}
```

---

# 🧩 **5️⃣ /verify — 최초 1회 접근 코드 입력 페이지**

```tsx
// /app/verify/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function VerifyPage() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const kakaoUserId = params.get("uid");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("access_links")
      .select("*")
      .eq("access_code", code)
      .single();

    if (error || !data) {
      setError("❌ 유효하지 않은 접근 코드입니다.");
      setLoading(false);
      return;
    }

    // kakao_user_id 연결 및 활성화
    await supabase
      .from("access_links")
      .update({
        kakao_user_id: kakaoUserId,
        kakao_nickname: data.kakao_nickname ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    router.push("/map");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">접근 코드 인증</h1>
      <p className="mb-6 text-gray-600">
        관리자에게 발급받은 코드를 입력하세요. <br />
        최초 1회 인증만 필요합니다.
      </p>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border border-gray-300 rounded p-2 w-64 text-center"
        placeholder="접근 코드를 입력하세요"
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button
        onClick={handleVerify}
        disabled={loading}
        className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "확인 중..." : "인증하기"}
      </button>
    </main>
  );
}
```

---

# 🧱 **6️⃣ RLS 정책 (access_links)**

```sql
ALTER TABLE access_links ENABLE ROW LEVEL SECURITY;

-- 본인만 조회 가능
CREATE POLICY "Users can view only their own record"
ON access_links
FOR SELECT
USING (kakao_user_id = auth.jwt()->>'sub');

-- 본인만 수정 가능
CREATE POLICY "Users can update only their own record"
ON access_links
FOR UPDATE
USING (kakao_user_id = auth.jwt()->>'sub');
```

---

# ✅ **7️⃣ UX 결과**

| 상황                              | UX 결과                                         |
| --------------------------------- | ----------------------------------------------- |
| 첫 로그인                         | 카카오 로그인 → 접근 코드 입력 요청 (`/verify`) |
| 접근 코드 인증 완료               | `/map`으로 자동 이동                            |
| 이후 로그인                       | 카카오 로그인만으로 즉시 진입                   |
| 비활성화 유저 (`is_active=false`) | 로그인 불가, `/login?error=not_active` 표시     |

---

# 🧩 **8️⃣ 확장 가능성**

| 향후 기능             | 방법                                     |
| --------------------- | ---------------------------------------- |
| ✅ 관리자 승인 시스템 | `is_active=false`로 대기 중 유저 승인    |
| ✅ 자동 세션 관리     | Supabase Auth 세션 쿠키 연동             |
| ✅ 댓글/사진 작성     | `access_links.kakao_user_id`로 관계 연결 |
| ✅ 로그아웃           | `supabase.auth.signOut()` 호출           |

---

# 🧠 **9️⃣ 전체 구현 요약**

| 항목                       | 상태         | 설명                            |
| -------------------------- | ------------ | ------------------------------- |
| DB 스키마                  | ✅ 완료      | `access_links` 필드 그대로 사용 |
| Next.js `/login`           | ✅ 완료      | 카카오 OAuth 버튼만 표시        |
| `/api/auth/kakao/callback` | ✅ 구현      | 유저 정보 + 첫 로그인 분기 처리 |
| `/verify`                  | ✅ 구현      | 최초 접근 코드 인증 페이지      |
| RLS 정책                   | ✅ 작성      | 유저별 접근 제어                |
| UX 플로우                  | ✅ 설계 완료 | 최초 인증 → 이후 자동 로그인    |
