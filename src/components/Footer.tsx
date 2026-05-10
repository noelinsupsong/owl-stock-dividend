import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-neutral-50 py-6 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed">
          본 서비스는 투자 정보 제공을 목적으로 하며, 투자 자문이 아닙니다.
          <br className="hidden sm:inline" />
          {" "}모든 투자 결정은 이용자 본인의 책임입니다.
        </p>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/about" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            소개
          </Link>
          <Link href="/methodology" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            데이터 출처
          </Link>
          <Link href="/privacy" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            이용약관
          </Link>
          <a
            href="mailto:noelinsupsong@gmail.com"
            className="hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            문의
          </a>
        </nav>
      </div>
    </footer>
  );
}
