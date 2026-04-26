/**
 * 공공데이터포털 - 금융위원회 주식배당정보 API V2 클라이언트
 *
 * 참고: https://www.data.go.kr/data/15043284/openapi.do
 * 엔드포인트: https://apis.data.go.kr/1160100/GetStocDiviInfoService_V2/getDiviInfo_V2
 *
 * 필드 주의:
 *  - basDt:        데이터 갱신일 (응답 시점) — 실제 배당기준일이 아님
 *  - dvdnBasDt:    배당기준일 (record date) ← 캘린더 그룹 키
 *  - cashDvdnPayDt: 현금배당지급일 (입금일)
 *  - stckDvdnRcdNm: 배당사유명 ("현금배당" / "주식배당" / "무배당" 등)
 *  - scrsItmsKcdNm: 주식종류 ("보통주" / "우선주")
 */

const BASE_URL =
  "https://apis.data.go.kr/1160100/GetStocDiviInfoService_V2/getDiviInfo_V2";

/** API V2 응답 단건 */
export interface PublicDataDividendItem {
  basDt: string;                // 데이터 갱신일 (YYYYMMDD)
  crno: string;                 // 법인등록번호
  isinCd: string;               // ISIN 코드
  isinCdNm?: string;            // ISIN 코드명
  stckIssuCmpyNm: string;       // 주식발행회사명
  scrsItmsKcd?: string;         // 주식종류 코드
  scrsItmsKcdNm?: string;       // 주식종류명 (보통주/우선주)
  stckParPrc?: string;          // 주식액면가
  trsnmDptyDcdNm?: string;      // 명의개서대리인
  stckStacMd?: string;          // 결산월
  dvdnBasDt?: string;           // 배당기준일 (YYYYMMDD)
  cashDvdnPayDt?: string;       // 현금배당지급일 (YYYYMMDD)
  stckHndvDt?: string;          // 주식교부일 (YYYYMMDD)
  stckDvdnRcd?: string;         // 배당사유 코드
  stckDvdnRcdNm?: string;       // 배당사유명 (현금배당/주식배당/무배당)
  stckGenrDvdnAmt?: string;     // 주식일반배당금액 (원)
  stckGrdnDvdnAmt?: string;     // 주식차등배당금액 (원)
  stckGenrCashDvdnRt?: string;  // 주식일반현금배당률 (%)
  stckGenrDvdnRt?: string;      // 주식일반배당률 (%)
  cashGrdnDvdnRt?: string;      // 현금차등배당률 (%)
  stckGrdnDvdnRt?: string;      // 주식차등배당률 (%)
}

interface PublicDataResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      numOfRows: number;
      pageNo: number;
      totalCount: number;
      items?: { item: PublicDataDividendItem | PublicDataDividendItem[] };
    };
  };
}

export interface FetchDividendsParams {
  /** 데이터 갱신일 (배당기준일 아님 — V2부터 의미 변경) */
  basDt?: string;
  /** 법인등록번호 */
  crno?: string;
  /** ISIN 코드 */
  isinCd?: string;
  /** 주식발행회사명 */
  stckIssuCmpyNm?: string;
  /** 페이지 번호 (기본 1) */
  pageNo?: number;
  /** 페이지당 건수 (기본 100, 최대 10000) */
  numOfRows?: number;
}

function getApiKey(): string {
  const key = process.env.PUBLIC_DATA_API_KEY;
  if (!key) {
    throw new Error("PUBLIC_DATA_API_KEY environment variable is not set");
  }
  return key;
}

export async function fetchDividends(
  params: FetchDividendsParams = {}
): Promise<{
  items: PublicDataDividendItem[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
}> {
  const url = new URL(BASE_URL);
  url.searchParams.set("serviceKey", getApiKey());
  url.searchParams.set("resultType", "json");
  url.searchParams.set("numOfRows", String(params.numOfRows ?? 1000));
  url.searchParams.set("pageNo", String(params.pageNo ?? 1));

  if (params.basDt) url.searchParams.set("basDt", params.basDt);
  if (params.crno) url.searchParams.set("crno", params.crno);
  if (params.isinCd) url.searchParams.set("isinCd", params.isinCd);
  if (params.stckIssuCmpyNm)
    url.searchParams.set("stckIssuCmpyNm", params.stckIssuCmpyNm);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Public Data API error: ${res.status} ${res.statusText}`
    );
  }

  const text = await res.text();
  let json: PublicDataResponse;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse Public Data API response. Body: ${text.slice(0, 500)}`
    );
  }

  const header = json.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(
      `Public Data API returned error: [${header?.resultCode}] ${header?.resultMsg}`
    );
  }

  const body = json.response.body;
  const rawItems = body.items?.item;
  const items: PublicDataDividendItem[] = !rawItems
    ? []
    : Array.isArray(rawItems)
    ? rawItems
    : [rawItems];

  return {
    items,
    pageNo: body.pageNo,
    numOfRows: body.numOfRows,
    totalCount: body.totalCount,
  };
}

/**
 * 모든 페이지를 순회하여 배당 항목 전체를 가져옴.
 * @param onProgress 페이지 받을 때마다 호출되는 콜백 (진행률 로깅용)
 */
export async function fetchAllDividends(
  params: Omit<FetchDividendsParams, "pageNo"> = {},
  onProgress?: (info: {
    pageNo: number;
    fetched: number;
    totalCount: number;
  }) => void
): Promise<PublicDataDividendItem[]> {
  const numOfRows = params.numOfRows ?? 1000;
  const all: PublicDataDividendItem[] = [];
  let pageNo = 1;

  while (true) {
    const { items, totalCount } = await fetchDividends({
      ...params,
      pageNo,
      numOfRows,
    });
    all.push(...items);
    onProgress?.({ pageNo, fetched: all.length, totalCount });

    if (all.length >= totalCount || items.length === 0) break;
    pageNo += 1;
  }

  return all;
}
