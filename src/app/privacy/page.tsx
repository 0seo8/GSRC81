"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronLeft } from "lucide-react";

/**
 * 개인정보 처리방침 페이지
 */
export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* 헤더 - 뒤로가기 & 닫기 버튼 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-base">
        <div className="flex items-center justify-between px-4 py-4">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>

          {/* 닫기 버튼 */}
          <Link
            href="/login"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-black" />
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 px-6 py-8 pt-20">
        <div className="max-w-3xl mx-auto">
          {/* 타이틀 */}
          <h1 className="text-2xl font-bold text-black mb-2">
            개인정보 처리방침
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            최종 업데이트: 2024년 12월
          </p>

          {/* 내용 */}
          <div className="space-y-6 text-gray-800">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. 개인정보의 수집 및 이용 목적</h2>
              <p className="leading-relaxed text-sm mb-2">
                GSRC81(이하 &ldquo;크루&rdquo;)은 다음의 목적을 위하여 개인정보를 처리합니다:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li>회원 가입 및 관리</li>
                <li>서비스 제공 및 운영 (러닝 코스 정보, 정기런 일정 공유)</li>
                <li>회원 간 소통 및 커뮤니티 운영</li>
                <li>서비스 개선 및 통계 분석</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. 수집하는 개인정보 항목</h2>
              <p className="leading-relaxed text-sm mb-2">
                크루는 카카오톡 소셜 로그인을 통해 다음의 정보를 수집합니다:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li><strong>필수 정보:</strong> 카카오 계정 정보 (이메일, 닉네임, 프로필 이미지)</li>
                <li><strong>선택 정보:</strong> 러닝 기록, 코스 댓글 및 활동 내역</li>
              </ul>
              <p className="leading-relaxed text-sm mt-3">
                <em>※ 선택 정보는 사용자의 동의 하에 수집되며, 거부 시에도 기본 서비스 이용이 가능합니다.</em>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="leading-relaxed text-sm mb-2">
                크루는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만, 다음의 경우에는 명시한 기간 동안 보존합니다:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li><strong>회원 탈퇴 시:</strong> 즉시 파기 (단, 관련 법령에 따라 보존이 필요한 경우 예외)</li>
                <li><strong>서비스 이용 기록:</strong> 회원 탈퇴 후 최대 1년</li>
              </ul>
              <p className="leading-relaxed text-sm mt-3">
                관련 법령에 따라 보존이 필요한 경우:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
                <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
              <p className="leading-relaxed text-sm">
                크루는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. 개인정보의 처리 위탁</h2>
              <p className="leading-relaxed text-sm mb-2">
                크루는 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 font-semibold">수탁업체</th>
                      <th className="text-left py-2 font-semibold">위탁 업무</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">카카오</td>
                      <td className="py-2">소셜 로그인 인증</td>
                    </tr>
                    <tr>
                      <td className="py-2">Vercel</td>
                      <td className="py-2">서비스 호스팅 및 운영</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. 정보주체의 권리·의무 및 행사 방법</h2>
              <p className="leading-relaxed text-sm mb-2">
                이용자는 다음과 같은 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리 정지 요구</li>
                <li>회원 탈퇴 (개인정보 수집 및 이용 동의 철회)</li>
              </ul>
              <p className="leading-relaxed text-sm mt-3">
                위 권리 행사는 크루의 고객센터를 통해 가능하며, 크루는 지체 없이 조치하겠습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. 개인정보 보호책임자</h2>
              <div className="bg-gray-100 p-4 rounded-lg text-sm">
                <p className="mb-1"><strong>책임자:</strong> GSRC81 운영팀</p>
                <p><strong>문의:</strong> 크루 내 공지사항 또는 운영진 연락처를 통해 문의 가능</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. 개인정보 처리방침 변경</h2>
              <p className="leading-relaxed text-sm">
                본 개인정보 처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가·삭제 및 수정될 수 있습니다. 변경 시 크루 채널을 통해 공지하며, 중요한 변경사항의 경우 개별 통지합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. 기타</h2>
              <p className="leading-relaxed text-sm">
                크루의 서비스에 링크되어 있는 외부 사이트에서의 개인정보 처리에 대해서는 크루가 책임을 지지 않습니다.
              </p>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
