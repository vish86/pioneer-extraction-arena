"use client";

import type { DomainKey } from "@/lib/types";
import { DOMAINS } from "@/lib/scenarios";

type Props = {
  active: DomainKey;
  onChange: (k: DomainKey) => void;
};

export function DomainSelector({ active, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 border-b border-[var(--border)] md:grid-cols-4">
      {DOMAINS.map((d) => {
        const isActive = d.key === active;
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onChange(d.key)}
            className={`flex flex-col items-start gap-0.5 border-b-2 px-3 py-3 text-left transition-colors sm:px-4 ${
              isActive
                ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-dim)] hover:bg-[var(--surface)]"
            } `}
          >
            <span className="font-display text-xs font-bold uppercase tracking-widest sm:text-sm">
              <span className="mr-1">{d.emoji}</span>
              {d.label}
            </span>
            <span className="hidden text-[10px] text-[var(--text-dim)] sm:block">
              {d.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
