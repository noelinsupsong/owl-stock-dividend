-- ============================================================================
-- Migration 001: stocks 테이블에 current_price 컬럼 추가
-- 적용처: Supabase SQL Editor
-- 1회만 실행하면 됨 (IF NOT EXISTS 보호 포함)
-- ============================================================================

ALTER TABLE stocks
  ADD COLUMN IF NOT EXISTS current_price BIGINT;

COMMENT ON COLUMN stocks.current_price IS
  '주식시세정보 API getStockPriceInfo의 종가(clpr) 기준 현재가 (원 단위)';
