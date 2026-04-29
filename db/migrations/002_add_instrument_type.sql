-- ============================================================================
-- Migration 002: stocks 테이블에 instrument_type 컬럼 추가
-- 목적: 일반 주식과 ETF/ETN 등을 구분하여 캘린더 카테고리 필터링에 사용
-- 적용처: Supabase SQL Editor
-- 1회만 실행 (IF NOT EXISTS 보호)
-- ============================================================================

ALTER TABLE stocks
  ADD COLUMN IF NOT EXISTS instrument_type VARCHAR(10) NOT NULL DEFAULT 'STOCK';

COMMENT ON COLUMN stocks.instrument_type IS
  '증권 유형: STOCK(일반 주식) / ETF(상장지수펀드). 캘린더 카테고리 필터 분기용.';

-- 카테고리 필터(market + instrument_type 결합 조회) 가속용 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_stocks_instrument_type
  ON stocks(instrument_type)
  WHERE instrument_type <> 'STOCK';
