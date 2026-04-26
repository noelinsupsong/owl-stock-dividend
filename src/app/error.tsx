"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🦉</div>
      <h2 className="text-lg font-semibold">문제가 발생했어요</h2>
      <p className="text-sm text-neutral-500">
        일시적인 오류일 수 있습니다. 다시 시도해보세요.
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-neutral-400">
          오류 ID: {error.digest}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          캘린더로
        </Link>
      </div>
    </main>
  );
}
