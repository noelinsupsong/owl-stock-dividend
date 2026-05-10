import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "Owl Stock Dividend 개인정보처리방침. 본 서비스가 수집하는 정보, 이용 목적, 제3자 서비스, 사용자 권리에 대한 안내.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← 캘린더로
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">개인정보처리방침</h1>
        <p className="mt-2 text-xs text-neutral-500">최종 업데이트: 2026년 5월 10일</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          1. 수집하는 정보
        </h2>
        <p>
          Owl Stock Dividend(이하 &ldquo;서비스&rdquo;)는 회원가입 절차가 없으며,
          이름·이메일·주민등록번호·전화번호 등 개인을 식별할 수 있는 정보를
          수집하지 않습니다.
        </p>
        <p>다만 다음 정보가 자동으로 수집되거나 사용됩니다:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <b>브라우저 localStorage</b>: 최근 검색한 종목 목록(최대 5개).
            사용자 브라우저에만 저장되며 서버로 전송되지 않습니다.
          </li>
          <li>
            <b>접속 로그</b>: Vercel 호스팅 인프라가 자동으로 기록하는 IP
            주소·접속 시간·User-Agent 등 표준 웹 액세스 로그.
          </li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          2. 쿠키 및 추적 기술
        </h2>
        <p>
          본 서비스는 Google AdSense를 통해 광고를 제공할 수 있습니다. 이 경우
          Google과 협력 광고주들이 사용자의 방문 정보를 기반으로 맞춤 광고를
          제공하기 위해 쿠키를 사용할 수 있습니다.
        </p>
        <p>
          Google 광고 쿠키 사용을 거부하려면{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
          >
            Google 광고 설정
          </a>
          을 방문하시거나, 브라우저에서 쿠키를 차단할 수 있습니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          3. 제3자 서비스
        </h2>
        <p>본 서비스는 다음 제3자 서비스를 활용합니다:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <b>Vercel</b> (호스팅 및 CDN) —{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              Vercel Privacy Policy
            </a>
          </li>
          <li>
            <b>Supabase</b> (데이터베이스) —{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              Supabase Privacy Policy
            </a>
          </li>
          <li>
            <b>Google AdSense</b> (광고) —{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              Google Privacy Policy
            </a>
          </li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          4. 사용자 권리
        </h2>
        <p>
          본 서비스는 개인 식별 정보를 저장하지 않으므로 별도의 정보 열람·정정·삭제
          요청 절차가 필요하지 않습니다. 브라우저에 저장된 최근 검색 목록은
          브라우저 설정에서 사이트 데이터를 삭제하면 즉시 제거됩니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          5. 약관 변경
        </h2>
        <p>
          본 개인정보처리방침은 법령 또는 서비스 정책 변동에 따라 개정될 수
          있으며, 변경 사항은 본 페이지를 통해 사전에 공지됩니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          6. 문의
        </h2>
        <p>
          개인정보처리방침에 관한 문의는{" "}
          <a
            href="mailto:noelinsupsong@gmail.com"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
          >
            noelinsupsong@gmail.com
          </a>
          으로 보내주세요.
        </p>
      </section>
    </main>
  );
}
