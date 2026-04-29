/**
 * KRX Open API 클라이언트 (data-dbg.krx.co.kr)
 *
 * 인증: HTTP Header `AUTH_KEY: <인증키>`
 * 환경변수: KRX_AUTH_KEY
 *
 * 참고: https://openapi.krx.co.kr/
 *
 * 응답 구조:
 *   { OutBlock_1: [ {필드: 값, ...}, ... ] }
 *
 * 본 프로젝트에서는 ETF 일별매매정보만 사용한다.
 *  - 주식 배당 정보는 공공데이터포털을 통해 별도 ingest (public-data.ts)
 *  - ETF 분배금 데이터는 KRX Open API에 endpoint 없음 (Phase B에서 별도 소스)
 */

// KRX 공식 예제는 http://를 사용. HTTPS로 호출 시 redirect 또는 헤더 유실 가능성.
const BASE_URL = "http://data-dbg.krx.co.kr/svc/apis";

/** ETF 일별매매정보 응답 단건. 일부 필드는 시점/유형에 따라 빠질 수 있음. */
export interface KrxEtfTradeItem {
  BAS_DD: string;            // 기준일 (YYYYMMDD)
  ISU_CD: string;            // 종목코드 (단축코드 6자리 또는 표준코드 12자리)
  ISU_NM: string;            // 종목명
  MKT_NM?: string;           // 시장구분 ("ETF")
  SECUGRP_NM?: string;       // 증권그룹명
  IDX_IND_NM?: string;       // 추적지수명
  TDD_CLSPRC?: string;       // 종가 (원)
  CMPPREVDD_PRC?: string;    // 전일대비
  FLUC_RT?: string;          // 등락률 (%)
  NAV?: string;              // 순자산가치
  TDD_OPNPRC?: string;       // 시가
  TDD_HGPRC?: string;        // 고가
  TDD_LWPRC?: string;        // 저가
  ACC_TRDVOL?: string;       // 거래량
  ACC_TRDVAL?: string;       // 거래대금
  MKTCAP?: string;           // 시가총액 (원)
  INVSTASST_NETASST_TOTAMT?: string; // 순자산총액 (원)
  LIST_SHRS?: string;        // 상장좌수
}

interface KrxResponse<T> {
  OutBlock_1?: T[];
  // KRX는 에러 시 별도 포맷으로 응답할 수 있음
  ErrorMsg?: string;
  errMsg?: string;
}

function getAuthKey(): string {
  const key = process.env.KRX_AUTH_KEY;
  if (!key) {
    throw new Error(
      "KRX_AUTH_KEY environment variable is not set. " +
        "Issue at https://openapi.krx.co.kr/ then add to .env.local."
    );
  }
  return key;
}

/** 영업일이 아니면 OutBlock_1이 빈 배열로 응답 */
export async function fetchEtfDailyTrades(params: {
  basDd: string; // YYYYMMDD
}): Promise<KrxEtfTradeItem[]> {
  const url = new URL(`${BASE_URL}/etp/etf_bydd_trd`);
  url.searchParams.set("basDd", params.basDd);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      AUTH_KEY: getAuthKey(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `KRX ETF API error: ${res.status} ${res.statusText} ${body.slice(0, 300)}`
    );
  }

  const text = await res.text();
  let json: KrxResponse<KrxEtfTradeItem>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse KRX ETF API response. Body: ${text.slice(0, 500)}`
    );
  }

  if (json.ErrorMsg || json.errMsg) {
    throw new Error(`KRX ETF API: ${json.ErrorMsg ?? json.errMsg}`);
  }

  return json.OutBlock_1 ?? [];
}

/**
 * 가장 최근 영업일을 자동 탐지.
 * 오늘부터 거꾸로 최대 10일까지 시도 — 응답 OutBlock_1이 비어있지 않은 첫 날을 반환.
 */
export async function findLatestEtfTradeDate(): Promise<string> {
  const today = new Date();
  for (let i = 0; i < 10; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ymd =
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    const items = await fetchEtfDailyTrades({ basDd: ymd });
    if (items.length > 0) return ymd;
  }
  throw new Error("KRX ETF: no data found in last 10 days");
}
