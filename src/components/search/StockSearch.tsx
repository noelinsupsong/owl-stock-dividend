"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StockSearchResult } from "@/types/dividend";

const RECENT_KEY = "dividend:recentStocks";
const MAX_RECENT = 5;

export function StockSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [recent, setRecent] = useState<StockSearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // 디바운스 검색
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      })
        .then((res) => res.json())
        .then((json) => {
          setResults((json.data ?? []) as StockSearchResult[]);
          setHighlight(0);
        })
        .catch(() => {
          /* aborted or network error — silent */
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const visibleList: StockSearchResult[] =
    query.trim() === "" ? recent : results;

  const select = (item: StockSearchResult) => {
    pushRecent(item);
    setRecent(loadRecent());
    setOpen(false);
    setQuery("");
    router.push(`/stock/${item.stock_code}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, visibleList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      const target = visibleList[highlight];
      if (target) {
        e.preventDefault();
        select(target);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:max-w-xs">
      <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-950">
        <span className="text-neutral-400">🔍</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="종목명 또는 코드"
          className="w-full bg-transparent text-sm outline-none"
          aria-label="종목 검색"
        />
      </div>

      {open && visibleList.length > 0 && (
        <ul className="absolute left-0 right-0 z-40 mt-1 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {query.trim() === "" && (
            <li className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-neutral-400">
              최근 검색
            </li>
          )}
          {visibleList.map((item, idx) => (
            <li key={item.stock_code}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => select(item)}
                className={
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm " +
                  (idx === highlight
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60")
                }
              >
                <span className="font-medium">{item.stock_name}</span>
                <span className="text-xs text-neutral-500">
                  {item.stock_code} · {item.market}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function loadRecent(): StockSearchResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as StockSearchResult[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(item: StockSearchResult) {
  if (typeof window === "undefined") return;
  const list = loadRecent().filter((s) => s.stock_code !== item.stock_code);
  list.unshift(item);
  window.localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(list.slice(0, MAX_RECENT))
  );
}
