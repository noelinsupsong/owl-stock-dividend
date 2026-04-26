/**
 * 공공데이터포털 - 금융위원회 주식시세정보 API 클라이언트
 *
 * 참고: https://www.data.go.kr/data/15094808/openapi.do
 * 엔드포인트: https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo
 */

const BASE_URL =
  "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo";

export interface PriceItem {
  basDt: string;        // 데이터 기준일자 (YYYYMMDD)
  srtnCd: string;       // 단축코드 (6자리, 종목코드)
  isinCd: string;       // ISIN
  itmsNm: string;       // 종목명
  mrktCtg: string;      // 시장구분 (KOSPI / KOSDAQ / KONEX)
  clpr: string;         // 종가
  vs?: string;          // 전일대비
  fltRt?: string;       // 등락률 (%)
  mkp?: string;         // 시가
  hipr?: string;        // 고가
  lopr?: string;        // 저가
  trqu?: string;        // 거래량
  trPrc?: string;       // 거래대금
  lstgStCnt?: string;   // 상장주식수
  mrktTotAmt: string;   // 시가총액 (원)
}

interface PriceResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      numOfRows: number;
      pageNo: number;
      totalCount: number;
      items?: { item: PriceItem | PriceItem[] };
    };
  };
}

export interface FetchPriceParams {
  basDt?: string;       // 기준일자 (YYYYMMDD)
  beginBasDt?: string;
  endBasDt?: string;
  isinCd?: string;
  likeIsinCd?: string;
  srtnCd?: string;
  itmsNm?: string;
  mrktCtg?: "KOSPI" | "KOSDAQ" | "KONEX";
  pageNo?: number;
  numOfRows?: number;
}

function getApiKey(): string {
  const key = process.env.PUBLIC_DATA_API_KEY;
  if (!key) throw new Error("PUBLIC_DATA_API_KEY missing");
  return key;
}

export async function fetchPrices(params: FetchPriceParams = {}): Promise<{
  items: PriceItem[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
}> {
  const url = new URL(BASE_URL);
  url.searchParams.set("serviceKey", getApiKey());
  url.searchParams.set("resultType", "json");
  url.searchParams.set("numOfRows", String(params.numOfRows ?? 1000));
  url.searchParams.set("pageNo", String(params.pageNo ?? 1));
  for (const [k, v] of Object.entries(params)) {
    if (k === "pageNo" || k === "numOfRows") continue;
    if (v != null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Price API error: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  let json: PriceResponse;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Price API parse failed. Body: ${text.slice(0, 300)}`);
  }
  const header = json.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(`Price API: [${header?.resultCode}] ${header?.resultMsg}`);
  }
  const body = json.response.body;
  const raw = body.items?.item;
  const items = !raw ? [] : Array.isArray(raw) ? raw : [raw];
  return {
    items,
    pageNo: body.pageNo,
    numOfRows: body.numOfRows,
    totalCount: body.totalCount,
  };
}

/** 특정 일자의 모든 종목 시세를 페이징으로 전체 수집 */
export async function fetchAllPricesForDate(
  basDt: string,
  onProgress?: (info: { pageNo: number; fetched: number; totalCount: number }) => void
): Promise<PriceItem[]> {
  const all: PriceItem[] = [];
  let pageNo = 1;
  while (true) {
    const { items, totalCount } = await fetchPrices({
      basDt,
      pageNo,
      numOfRows: 1000,
    });
    all.push(...items);
    onProgress?.({ pageNo, fetched: all.length, totalCount });
    if (all.length >= totalCount || items.length === 0) break;
    pageNo += 1;
  }
  return all;
}
