import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "소개",
  description:
    "Owl Stock Dividend 서비스 소개 — KOSPI · KOSDAQ 배당 일정을 한눈에 확인할 수 있는 무료 캘린더.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← 캘린더로
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">서비스 소개</h1>
        <p className="mt-2 text-sm text-neutral-500">
          KOSPI · KOSDAQ 배당 일정을 한눈에 확인할 수 있는 무료 서비스
        </p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          무엇을 제공하나요
        </h2>
        <p>
          Owl Stock Dividend는 한국 유가증권시장(KOSPI)과 코스닥시장(KOSDAQ)에
          상장된 기업들의 배당 입금일과 배당락일을 달력 형태로 제공합니다.
          여러 사이트를 돌아다니지 않고도 월별 배당 일정을 한 화면에서 파악할 수
          있도록 설계되었습니다.
        </p>
        <p>주요 기능:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>월별 캘린더에서 배당 입금일·배당락일 동시 확인</li>
          <li>날짜 클릭 시 해당일의 전체 배당 종목 상세 보기</li>
          <li>종목명·종목코드 검색 및 자동완성</li>
          <li>종목 상세 페이지: 다음 배당 일정, 과거 5년 배당 이력, 추이 차트</li>
          <li>시가총액 기준 시장 필터 (KOSPI / KOSDAQ)</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          데이터 갱신
        </h2>
        <p>
          배당 정보는 매일 새벽 자동으로 갱신됩니다. 시세·시가총액은 매일
          한국 증시 마감 이후 갱신됩니다. 자세한 출처와 갱신 주기는{" "}
          <Link
            href="/methodology"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
          >
            데이터 출처
          </Link>
          {" "}페이지에서 확인하실 수 있습니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          면책 사항
        </h2>
        <p>
          본 서비스는 투자 정보 제공을 목적으로 하며, 투자 자문이나 투자 권유가
          아닙니다. 모든 투자 결정과 그에 따르는 책임은 이용자 본인에게 있습니다.
          데이터의 정확성에 최선을 다하고 있으나, 실제 매매 전에는 한국거래소
          공시 또는 증권사 시세 시스템을 통해 반드시 확인하시기 바랍니다. 자세한
          내용은{" "}
          <Link
            href="/terms"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
          >
            이용약관
          </Link>
          을 참고해주세요.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          문의
        </h2>
        <p>
          서비스 관련 문의·제안·오류 제보는{" "}
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
