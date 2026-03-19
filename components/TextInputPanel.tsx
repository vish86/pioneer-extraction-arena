"use client";

import { Zap } from "lucide-react";
import type { DomainKey } from "@/lib/types";
import { getDomain } from "@/lib/scenarios";

type Props = {
  domain: DomainKey;
  text: string;
  onTextChange: (v: string) => void;
  disabled: boolean;
  modelCount: number;
  onRun: () => void;
  onClear: () => void;
};

export function TextInputPanel({
  domain,
  text,
  onTextChange,
  disabled,
  modelCount,
  onRun,
  onClear,
}: Props) {
  const d = getDomain(domain);
  return (
    <div className="flex flex-col border-b border-[var(--border)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-2 sm:px-4">
        <span className="font-mono text-[10px] uppercase text-[var(--text-dim)]">
          Schema:
        </span>
        <div className="flex flex-wrap gap-1">
          {d.schema.map((s) => (
            <span
              key={s}
              className="rounded border border-[var(--border-bright)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-dim)]"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={disabled}
        rows={5}
        className="min-h-[120px] w-full resize-y bg-transparent px-3 py-3 font-mono text-sm text-[var(--text)] outline-none ring-inset focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50 sm:px-4"
        spellCheck={false}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2 sm:px-4">
        <span className="font-mono text-[10px] text-[var(--text-dim)]">
          {text.length} chars · {modelCount} models competing
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="rounded border border-[var(--border-bright)] px-3 py-1.5 text-xs text-[var(--text-dim)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onRun}
            disabled={disabled || !text.trim()}
            className="flex items-center gap-1.5 rounded bg-[var(--accent)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-black shadow-[0_0_20px_var(--accent-dim)] hover:brightness-110 disabled:opacity-50"
          >
            {disabled ? (
              "Racing…"
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Run Extraction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
