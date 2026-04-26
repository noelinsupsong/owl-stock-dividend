/**
 * DART OpenAPI 클라이언트 (금융감독원 전자공시시스템)
 *
 * 참고: https://opendart.fss.or.kr/guide/main.do
 *
 * 사용 엔드포인트:
 *  - 고유번호 전체파일: /api/corpCode.xml (ZIP → CORPCODE.xml)
 *  - 배당에 관한 사항:  /api/alotMatter.json
 */

const BASE_URL = "https://opendart.fss.or.kr/api";

function getApiKey(): string {
  const key = process.env.DART_API_KEY;
  if (!key) throw new Error("DART_API_KEY environment variable is not set");
  return key;
}

// ────────────────────────────────────────────────────────────────────────────
// 1) 고유번호 전체파일 다운로드
//    - corp_code(8자리)는 DART 모든 API의 키. 사전 매핑 필요.
//    - 응답이 ZIP이므로 파싱은 호출 측에서 처리.
// ────────────────────────────────────────────────────────────────────────────
export async function downloadCorpCodeZip(retries = 4): Promise<ArrayBuffer> {
  const url = new URL(`${BASE_URL}/corpCode.xml`);
  url.searchParams.set("crtfc_key", getApiKey());

  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      return await res.arrayBuffer();
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw new Error(
    `DART corpCode download failed after ${retries} retries: ${(lastErr as Error)?.message ?? lastErr}`
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 2) 배당에 관한 사항 (정기보고서 주요사항)
// ────────────────────────────────────────────────────────────────────────────

export interface DartDividendItem {
  rcept_no: string;     // 접수번호
  corp_cls: string;     // Y(유가) / K(코스닥) / N(코넥스) / E(기타)
  corp_code: string;    // 고유번호 (8자리)
  corp_name: string;    // 회사명
  se: string;           // 구분 (예: 주당 현금배당금(원))
  stock_knd?: string;   // 주식종류 (보통주/우선주)
  thstrm: string;       // 당기 (값)
  frmtrm?: string;      // 전기
  lwfr?: string;        // 전전기
}

interface DartDividendResponse {
  status: string;
  message: string;
  list?: DartDividendItem[];
}

export interface FetchDartDividendParams {
  /** 고유번호 (8자리) */
  corp_code: string;
  /** 사업연도 (YYYY, 4자리) — 2015 이후 */
  bsns_year: string;
  /** 보고서 코드: 11013(1Q) / 11012(반기) / 11014(3Q) / 11011(사업보고서) */
  reprt_code: "11011" | "11012" | "11013" | "11014";
}

/**
 * DART 배당에 관한 사항 API 호출
 *
 * 응답 list의 각 항목은 (구분 × 주식종류) 한 행을 나타내며 thstrm/frmtrm/lwfr에
 * 당기/전기/전전기 값이 들어있다. 호출 측에서 se(구분) 키로 필요한 값을 추출.
 */
export async function fetchDartDividend(
  params: FetchDartDividendParams
): Promise<DartDividendItem[]> {
  const url = new URL(`${BASE_URL}/alotMatter.json`);
  url.searchParams.set("crtfc_key", getApiKey());
  url.searchParams.set("corp_code", params.corp_code);
  url.searchParams.set("bsns_year", params.bsns_year);
  url.searchParams.set("reprt_code", params.reprt_code);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`DART alotMatter request failed: ${res.status}`);
  }

  const json = (await res.json()) as DartDividendResponse;

  // status 코드: 000(정상), 013(데이터 없음), 그 외 오류
  if (json.status === "013") return [];
  if (json.status !== "000") {
    throw new Error(`DART API error: [${json.status}] ${json.message}`);
  }
  return json.list ?? [];
}

/**
 * DART 응답에서 (구분 × 주식종류) 조합 값을 안전하게 추출하는 헬퍼.
 * 예) extractValue(items, "주당 현금배당금(원)", "보통주")
 */
export function extractDartValue(
  items: DartDividendItem[],
  seContains: string,
  stockKind?: string
): string | undefined {
  const matched = items.find(
    (it) =>
      it.se?.includes(seContains) &&
      (!stockKind || it.stock_knd?.includes(stockKind))
  );
  return matched?.thstrm;
}
