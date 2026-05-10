-- ============================================================================
-- Migration 003: ETF 통합 롤백 (instrument_type 컬럼 제거 + ETF row 삭제)
-- 적용처: Supabase SQL Editor
-- 목적:
--  - Phase B (ETF 분배 데이터) 도입이 비현실적으로 판단되어 ETF 통합 전체 롤백
--  - 사이트 정체성을 "KOSPI·KOSDAQ 배당 캘린더"로 명확히 유지
-- 1회 실행
-- ============================================================================

-- 1) ETF 종목 row 삭제 (분배 이벤트가 없으므로 dividend_events 영향 없음)
DELETE FROM stocks WHERE instrument_type = 'ETF';

-- 2) instrument_type 사용 인덱스 제거
DROP INDEX IF EXISTS idx_stocks_instrument_type;

-- 3) instrument_type 컬럼 제거
ALTER TABLE stocks DROP COLUMN IF EXISTS instrument_type;
