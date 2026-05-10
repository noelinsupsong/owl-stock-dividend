import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "Owl Stock Dividend 이용약관. 서비스 이용 조건, 면책 조항, 책임 한계에 대한 안내.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← 캘린더로
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">이용약관</h1>
        <p className="mt-2 text-xs text-neutral-500">최종 업데이트: 2026년 5월 10일</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          제1조 (목적)
        </h2>
        <p>
          본 약관은 Owl Stock Dividend(이하 &ldquo;서비스&rdquo;)의 이용 조건과
          이용자·운영자 간의 권리·의무 및 책임 사항을 규정합니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          제2조 (서비스의 성격)
        </h2>
        <p>
          본 서비스는 KOSPI 및 KOSDAQ 상장 기업의 배당 일정을 정리해 보여주는
          <b> 정보 제공 서비스</b>입니다. <b>투자 자문이나 투자 권유가 아니며</b>,
          금융투자업법상의 투자자문업·투자중개업·투자일임업과 무관합니다.
        </p>
        <p>
          서비스에 표시되는 모든 정보는 참고용이며, 모든 투자 결정과 그에 따른
          이익·손실은 전적으로 이용자 본인에게 귀속됩니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          제3조 (데이터 정확성)
        </h2>
        <p>
          본 서비스는 공공데이터포털·DART·한국거래소 등 공식 출처의 데이터를
          기반으로 운영됩니다. 데이터의 정확성과 적시성에 최선을 다하고 있으나,
          다음과 같은 한계가 있을 수 있습니다:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>원천 데이터 출처의 갱신 지연 또는 누락</li>
          <li>API 일시적 장애로 인한 데이터 미반영</li>
          <li>배당락일은 배당기준일을 기준으로 산출한 추정치이며, 신 배당제도(2023년~) 적용 기업의 회사 별도 공시와 다를 수 있음</li>
          <li>분기/중간 배당 분류는 배당기준일 월 기반 추정이므로 일부 기업에 대해 부정확할 수 있음</li>
        </ul>
        <p>
          따라서 실제 매매 또는 자금 계획 수립 전에는 반드시{" "}
          <a
            href="https://kind.krx.co.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
          >
            한국거래소 KIND 공시
          </a>{" "}
          또는 본인이 이용하는 증권사 시스템에서 정보를 재확인하시기 바랍니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          제4조 (책임의 한계)
        </h2>
        <p>
          운영자는 다음 사항에 대하여 일체 책임을 지지 않습니다:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>본 서비스에 표시된 정보를 신뢰하여 발생한 투자 손실</li>
          <li>데이터의 부정확·지연·누락으로 인한 손해</li>
          <li>서비스 일시 중단·종료로 인한 불편</li>
          <li>제3자(공공데이터 제공기관, 호스팅 사업자, 광고 사업자 등)의 귀책 사유로 발생한 문제</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          제5조 (서비스 변경 및 중단)
        </h2>
        <p>
          운영자는 사전 공지 없이 서비스 내용·기능·데이터 출처를 변경하거나
          서비스를 중단할 수 있습니다. 본 서비스는 무상으로 제공되는 개인
          프로젝트이며, 안정적 운영이나 가용성을 보증하지 않습니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          제6조 (저작권)
        </h2>
        <p>
          본 서비스에 사용된 데이터의 원천 저작권은 각 출처 기관(공공데이터포털,
          DART, 한국거래소 등)에 있으며, 해당 기관의 이용약관을 준수합니다.
          서비스 화면 구성·코드·디자인의 권리는 운영자에게 있습니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          제7조 (약관 변경)
        </h2>
        <p>
          본 약관은 법령 또는 서비스 정책 변동에 따라 개정될 수 있으며, 변경
          사항은 본 페이지를 통해 공지됩니다. 변경 후에도 서비스를 계속 이용하는
          경우 변경된 약관에 동의한 것으로 간주합니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          문의
        </h2>
        <p>
          이용약관 관련 문의는{" "}
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
