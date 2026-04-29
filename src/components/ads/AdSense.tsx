"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface Props {
  /** Ad unit slot ID (data-ad-slot). 환경변수에서 받아 props로 전달 */
  slot: string | undefined;
  /**
   * AdSense 광고 형식.
   *  - "auto": 반응형 (기본)
   *  - "fluid": 인피드/내부 콘텐츠
   *  - "rectangle": 사각형 고정
   */
  format?: "auto" | "fluid" | "rectangle";
  /** 작은 화면에서 가로 100% 채울지 */
  responsive?: boolean;
  /** 추가 클래스 (여백 등) */
  className?: string;
}

/**
 * Google AdSense 광고 슬롯.
 *
 * - NEXT_PUBLIC_ADSENSE_CLIENT 또는 slot이 비어 있으면 아무것도 렌더하지 않음
 *   → 키 없는 환경(dev/preview)에서 빈 광고 박스가 안 잡힘
 * - adsbygoogle.js 스크립트는 layout.tsx에서 1회 로드
 * - 컴포넌트 마운트 시 push() 호출하여 슬롯 채움
 *
 * 사용:
 *   <AdSense slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP_BANNER} />
 */
export function AdSense({
  slot,
  format = "auto",
  responsive = true,
  className,
}: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // 광고 push 실패는 페이지 동작에 영향 주지 않게 무시
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
