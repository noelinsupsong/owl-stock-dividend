-- ============================================================================
-- Owl Stock Dividend DB 스키마 (PostgreSQL / Supabase)
-- ============================================================================

-- 종목 기본정보
CREATE TABLE IF NOT EXISTS stocks (
  id              SERIAL PRIMARY KEY,
  stock_code      VARCHAR(10) UNIQUE NOT NULL,        -- 종목코드 (예: 005930)
  isin_code       VARCHAR(20),                        -- 표준 ISIN 코드
  corp_code       VARCHAR(20),                        -- DART 고유번호 (8자리)
  stock_name      VARCHAR(100) NOT NULL,              -- 종목명 (예: 삼성전자)
  market          VARCHAR(10) NOT NULL,               -- 상장시장 (KOSPI / KOSDAQ / KONEX)
  instrument_type VARCHAR(10) NOT NULL DEFAULT 'STOCK', -- 증권 유형 (STOCK / ETF)
  market_cap      BIGINT,                             -- 시가총액 (원)
  sector          VARCHAR(50),                        -- 업종
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 배당 이벤트
CREATE TABLE IF NOT EXISTS dividend_events (
  id                 SERIAL PRIMARY KEY,
  stock_id           INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  fiscal_year        INTEGER NOT NULL,                  -- 사업연도
  dividend_type      VARCHAR(20) NOT NULL DEFAULT '결산', -- 결산/중간/분기
  record_date        DATE,                              -- 배당기준일
  ex_dividend_date   DATE,                              -- 배당락일 (계산값)
  payment_date       DATE,                              -- 배당지급일 (입금일)
  dividend_per_share DECIMAL(15, 2),                    -- 주당 배당금 (원)
  dividend_rate      DECIMAL(8, 4),                     -- 배당률 (%)
  dividend_yield     DECIMAL(8, 4),                     -- 배당수익률 (%)
  stock_type         VARCHAR(10) NOT NULL DEFAULT '보통주', -- 보통주/우선주
  yoy_change         DECIMAL(8, 2),                     -- 전년 대비 증감률 (%)
  source             VARCHAR(20),                       -- 데이터 출처 (PUBLIC_DATA / DART)
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stock_id, fiscal_year, dividend_type, stock_type)
);

-- 한국 공휴일 (배당락일 영업일 계산용)
CREATE TABLE IF NOT EXISTS holidays (
  holiday_date DATE PRIMARY KEY,
  name         VARCHAR(50),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dividend_payment_date  ON dividend_events(payment_date);
CREATE INDEX IF NOT EXISTS idx_dividend_ex_date       ON dividend_events(ex_dividend_date);
CREATE INDEX IF NOT EXISTS idx_dividend_record_date   ON dividend_events(record_date);
CREATE INDEX IF NOT EXISTS idx_dividend_stock         ON dividend_events(stock_id);
CREATE INDEX IF NOT EXISTS idx_stocks_market_cap      ON stocks(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_stocks_name            ON stocks(stock_name);
CREATE INDEX IF NOT EXISTS idx_stocks_instrument_type
  ON stocks(instrument_type) WHERE instrument_type <> 'STOCK';

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stocks_updated_at ON stocks;
CREATE TRIGGER trg_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dividend_events_updated_at ON dividend_events;
CREATE TRIGGER trg_dividend_events_updated_at
  BEFORE UPDATE ON dividend_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
