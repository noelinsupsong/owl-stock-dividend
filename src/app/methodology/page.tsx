import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "데이터 출처 및 방법론",
  description:
    "Owl Stock Dividend가 사용하는 데이터 출처(공공데이터포털, DART, KRX), 갱신 주기, 배당락일 산출 로직에 대한 안내.",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← 캘린더로
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          데이터 출처 및 방법론
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          본 서비스가 사용하는 데이터의 원천, 갱신 주기, 산출 로직을 투명하게
          공개합니다.
        </p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          1. 데이터 출처
        </h2>

        <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          1.1 배당 정보
        </h3>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <a
              href="https://www.data.go.kr/data/15043284/openapi.do"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              공공데이터포털 - 금융위원회 주식배당정보 API V2
            </a>{" "}
            — 배당기준일, 현금배당지급일, 주당 배당금, 배당률, 주식 종류(보통주/우선주)
          </li>
          <li>
            <a
              href="https://opendart.fss.or.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              금융감독원 DART OpenAPI
            </a>{" "}
            — 종목 메타데이터(법인 고유번호, 회사명, 시장구분) 보강
          </li>
        </ul>

        <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          1.2 시세 / 시가총액
        </h3>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <a
              href="https://www.data.go.kr/data/15094808/openapi.do"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              공공데이터포털 - 금융위원회 주식시세정보 API
            </a>{" "}
            — 종가, 시가총액, 시장구분(KOSPI/KOSDAQ)
          </li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          2. 갱신 주기
        </h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <b>배당 정보</b>: 매일 한국시간 새벽 자동 수집. 원천 API가 영업일 기준
            익일 오후 1시 이후 갱신되므로, 신규 배당 공시는 보통 다음날 반영됩니다.
          </li>
          <li>
            <b>시세 / 시가총액</b>: 매일 한국시간 오후 6시 직후 갱신. 직전 영업일
            종가를 기준으로 합니다.
          </li>
        </ul>
        <p>
          캘린더 페이지 좌측 상단의 &ldquo;마지막 갱신&rdquo; 시각에서 마지막 데이터
          반영 시점을 확인하실 수 있습니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          3. 배당락일 산출
        </h2>
        <p>
          한국 주식시장은 T+2 결제이므로, 배당을 받으려면 배당기준일 2영업일
          전까지 매수해야 합니다. 본 서비스는 다음 규칙으로 배당락일을 계산합니다:
        </p>
        <p className="rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs dark:bg-neutral-900">
          배당락일 = 배당기준일의 1영업일 전 (주말·공휴일 제외)
        </p>
        <p>
          한국 공휴일·대체공휴일은{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-900">
            date-holidays
          </code>{" "}
          라이브러리 기준으로 반영됩니다.
        </p>
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          ⚠️ <b>중요</b>: 2023년부터 시행된 신 배당제도에서는 회사가 배당기준일
          이후로 배당락일을 별도 공시할 수 있습니다. 이 경우 본 서비스의 추정값과
          실제 공시값이 다를 수 있으므로, 매수 전에 회사 공시를 반드시 확인해
          주세요.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          4. 배당 종류 분류
        </h2>
        <p>
          배당기준일의 월(month)을 기반으로 결산/중간/분기 배당을 추정합니다:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>1~5월, 12월 → 결산</li>
          <li>6월 → 중간</li>
          <li>9월 → 분기</li>
          <li>그 외 → 기타</li>
        </ul>
        <p className="text-xs text-neutral-500">
          한계: 분기배당 정책을 시행하는 기업(예: 삼성전자)은 3월 배당기준일이
          1분기 배당이지만 본 분류에서는 결산으로 잡힙니다. 정확한 배당 종류는
          회사 공시를 확인해 주세요.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          5. 시가총액 정렬
        </h2>
        <p>
          캘린더 셀에는 시가총액 상위 3개 종목만 우선 노출되며, 그 외 종목은
          &ldquo;+N개 더보기&rdquo;로 표시됩니다. 날짜를 클릭하면 해당일의 전체
          종목을 시가총액 순으로 확인할 수 있습니다.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          6. 면책
        </h2>
        <p>
          본 페이지에 기술된 산출 로직과 한계점은 서비스의 투명성을 위한 안내이며,
          정보의 완전성을 보증하지 않습니다. 자세한 책임 한계는{" "}
          <Link
            href="/terms"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
          >
            이용약관
          </Link>
          을 참고해주세요.
        </p>
      </section>
    </main>
  );
}
