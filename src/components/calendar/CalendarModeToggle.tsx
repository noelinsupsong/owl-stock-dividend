"use client";

import type { CalendarMode } from "@/types/dividend";

interface Props {
  mode: CalendarMode;
  onChange: (mode: CalendarMode) => void;
}

export function CalendarModeToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
      <ToggleButton
        active={mode === "payment"}
        onClick={() => onChange("payment")}
      >
        배당 입금일
      </ToggleButton>
      <ToggleButton
        active={mode === "ex_dividend"}
        onClick={() => onChange("ex_dividend")}
      >
        배당락일
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-4 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800")
      }
    >
      {children}
    </button>
  );
}
