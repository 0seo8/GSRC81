import Link from "next/link";
import { X } from "lucide-react";

/**
 * 이용약관 (회칙) 페이지
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* 헤더 - 로고 없이 X 버튼만 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-base">
        <div className="flex items-center justify-end px-4 py-4">
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
          <h1 className="text-2xl font-bold text-black mb-2">GSRC81 회칙</h1>
          <p className="text-sm text-gray-500 mb-8">
            최종 업데이트: 2025년 12월
          </p>

          {/* 내용 */}
          <div className="space-y-6 text-gray-800">
            <section>
              <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
              <p className="leading-relaxed text-sm">
                {`본 회칙은 GSRC81 러닝 크루(이하 "크루")의 운영 및 회원의 권리와 의무에 관한 사항을 규정함을 목적으로 합니다.`}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제2조 (회원 가입)</h2>
              <p className="leading-relaxed text-sm mb-2">
                1. 크루의 회원이 되고자 하는 자는 크루가 정한 절차에 따라 가입
                신청을 하여야 합니다.
              </p>
              <p className="leading-relaxed text-sm mb-2">
                2. 크루는 다음 각 호의 사유가 있는 경우 가입 신청을 거부할 수
                있습니다:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li>본인의 실명이 아니거나 타인의 명의를 도용한 경우</li>
                <li>허위 정보를 기재한 경우</li>
                <li>기타 크루가 정한 가입 요건을 충족하지 못한 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                제3조 (회원의 의무)
              </h2>
              <p className="leading-relaxed text-sm mb-2">
                회원은 다음 각 호의 의무를 준수하여야 합니다:
              </p>
              <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                <li>회칙 및 크루의 공지사항 준수</li>
                <li>정기런 및 크루 활동에 적극적인 참여</li>
                <li>다른 회원에 대한 존중과 배려</li>
                <li>안전한 러닝을 위한 주의 의무</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                제4조 (정기런 운영)
              </h2>
              <p className="leading-relaxed text-sm mb-2">
                1. 크루는 정기적으로 그룹 러닝을 개최하며, 일정은 사전에
                공지합니다.
              </p>
              <p className="leading-relaxed text-sm">
                2. 회원은 정기런 참가 시 안전 수칙을 준수하여야 하며, 본인의
                건강 상태를 고려하여 참가 여부를 결정하여야 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제5조 (면책 사항)</h2>
              <p className="leading-relaxed text-sm">
                크루는 회원이 러닝 활동 중 발생한 부상, 사고 등에 대해 책임을
                지지 않습니다. 회원은 본인의 책임 하에 활동에 참여하며, 필요한
                경우 개인 보험에 가입할 것을 권장합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                제6조 (개인정보 보호)
              </h2>
              <p className="leading-relaxed text-sm">
                크루는 회원의 개인정보를 관련 법령에 따라 보호하며, 자세한
                사항은{" "}
                <Link href="/privacy" className="text-blue-600 underline">
                  개인정보 처리방침
                </Link>
                에서 확인할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                제7조 (회칙의 변경)
              </h2>
              <p className="leading-relaxed text-sm">
                본 회칙은 필요에 따라 변경될 수 있으며, 변경 시 크루 채널을 통해
                공지합니다.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
