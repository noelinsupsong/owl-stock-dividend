import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🦉</div>
      <h2 className="text-lg font-semibold">404 — 페이지를 찾을 수 없어요</h2>
      <p className="text-sm text-neutral-500">
        주소를 다시 확인하거나 캘린더로 돌아가세요.
      </p>
      <Link
        href="/"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        캘린더로
      </Link>
    </main>
  );
}
