import type { CalendarMode } from "@/types/dividend";
import { dividendTypeBadgeClass } from "@/lib/format";

interface Props {
  mode: CalendarMode;
}

/**
 * 캘린더 하단 안내문.
 * 배당락일은 배당기준일에서 계산한 "추정값"이므로 사용자가 매수 결정 전에
 * 실제 공시를 확인하도록 강조한다.
 */
export function CalendarDisclaimer({ mode }: Props) {
  const isExDiv = mode === "ex_dividend";

  return (
    <section className="mt-6 space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        ℹ️ 캘린더 데이터 안내
      </h3>

      <Block title="📊 데이터 출처">
        <p>
          공공데이터포털「
          <a
            href="https://www.data.go.kr/data/15043284/openapi.do"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
          >
            금융위원회_주식배당정보
          </a>
          」API에서 회사가 신고한 <b>배당기준일(record date)</b>과{" "}
          <b>현금배당지급일(payment date)</b>을 매일 1회 받아옵니다.
        </p>
      </Block>

      <Block title="✅ 배당받으시려면 — 꼭 확인하세요">
        <ol className="ml-5 list-decimal space-y-1">
          <li>
            본 캘린더의 배당락일은 <b>참고용</b>입니다.
          </li>
          <li>
            매수 전, 해당 종목의{" "}
            <b>실제 배당락일을 회사 공시에서 직접 확인</b>하세요. (
            <a
              href="https://kind.krx.co.kr/disclosureinfo/dividendinfo.do"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              KRX KIND 배당정보
            </a>
            ,{" "}
            <a
              href="https://dart.fss.or.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              DART
            </a>
            , 증권사 HTS, 네이버 금융 등)
          </li>
          <li>
            한국 주식은 <b>T+2 결제</b>입니다 — 배당락일 <b>전 영업일까지</b>{" "}
            매수 주문이 체결되어야 배당기준일에 주주명부에 등재됩니다.
          </li>
        </ol>
      </Block>

      <Block title="🏷️ 배당종류 안내">
        <p className="mb-2">
          한국 상장사의 배당은 사업연도 내 어느 시점에 주주명부를 마감하는지에
          따라 다음 4가지로 분류됩니다.
        </p>
        <ul className="space-y-2">
          <TypeRow type="결산" label="결산">
            사업연도(보통 1/1~12/31) 종료 후, 한 해 전체 실적을 기준으로
            정기주총에서 결정해 지급하는 <b>연간 배당</b>. 한국에서 가장
            일반적이며 통상 3월 정기주총 후 4~5월에 입금됩니다.
          </TypeRow>
          <TypeRow type="중간" label="중간">
            사업연도 중간 시점(통상 6월 말)을 기준으로 지급하는 <b>반기 배당</b>.
            정관에 명시한 회사만 실시하며 8~9월경 입금되는 경우가 많습니다.
          </TypeRow>
          <TypeRow type="분기" label="분기">
            매 분기 말(3·6·9월)을 기준으로 지급하는 <b>분기 단위 배당</b>.
            삼성전자, 포스코홀딩스 등 일부 대형주가 시행합니다.
          </TypeRow>
          <TypeRow type="기타" label="기타">
            위 분류에 해당하지 않는 <b>특별배당이나 불규칙 배당</b>. 회사가
            임시주총에서 결정하거나 비정기적으로 지급한 경우.
          </TypeRow>
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          ※ 본 분류는 record date의 월로 자동 추정한 결과입니다. 신 배당제도
          (2023~) 적용 기업의 4월 record는 모두 「결산」으로 분류되며, 분기
          배당사의 1분기(3월)도 「결산」으로 표기될 수 있습니다.
        </p>
      </Block>

      <Block title="🧮 배당락일 계산 방식">
        <p>
          캘린더에 표시되는 <b>배당락일</b>은 회사 공시값이 아니라{" "}
          <b>배당기준일의 직전 영업일(D-1 영업일)</b>로 계산한{" "}
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            추정값
          </span>
          입니다. (한국 공휴일 자동 반영)
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          예: 배당기준일 4월 6일(월) → 배당락일 4월 3일(금)으로 표시
        </p>
      </Block>

      <Block title="⚠️ 2023년 배당제도 개편 이후 — 회사 공시값과 다를 수 있음">
        <p>
          2023년부터 일부 상장사는 「선배당 후투자」 제도를 도입하여{" "}
          <b>배당락일과 배당기준일을 분리</b>해 별도로 공시합니다. 이 경우 회사가
          공시한 실제 배당락일은 우리의 D-1 추정값과{" "}
          <b>1~2영업일 차이</b>가 날 수 있습니다.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          예: S-Oil 2025 결산 — 캘린더 표시 4월 3일(추정) vs 실제 회사 공시 4월
          2일
        </p>
      </Block>

      <Block title="🌙 데이터 갱신 시간 안내">
        <p>
          공공데이터포털·DART 등 정부 운영 API는{" "}
          <b>매일 자정 ~ 새벽 2시 KST 사이</b> 점검 시간이 있어, 이 시간대에는
          데이터 갱신 작업이 실패할 수 있습니다.
        </p>
        <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
          <li>
            점검 중에도 본 사이트는 <b>직전에 적재된 데이터를 그대로 표시</b>
            합니다 (외부 API 장애와 무관하게 캘린더는 정상 동작).
          </li>
          <li>
            다만 <b>최신 데이터를 정확히 받아보시려면</b> 새벽 점검 시간(자정 ~
            새벽 2시)을 피해 영업시간 또는 오전 시간대에 확인하시는 것을
            권장합니다.
          </li>
          <li>
            현재 표시되는 데이터의 적재 시각은 페이지 상단의{" "}
            <b>「🕒 마지막 갱신」</b> 표시에서 확인할 수 있습니다.
          </li>
        </ul>
      </Block>

      <p className="border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800">
        본 서비스는 정보 제공을 목적으로 하며 투자 조언이 아닙니다. 데이터의
        정확성을 보장하지 않으며, 이를 근거로 한 매매 결정 및 그로 인한 손실은
        사용자 책임입니다.
        {isExDiv && (
          <>
            {" "}현재 보고 있는 <b>배당락일 모드</b>의 날짜는 위 계산식으로
            추정한 값입니다.
          </>
        )}
      </p>
    </section>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function TypeRow({
  type,
  label,
  children,
}: {
  type: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 inline-flex h-5 w-12 shrink-0 items-center justify-center rounded text-xs font-medium ${dividendTypeBadgeClass(type)}`}
      >
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </li>
  );
}
