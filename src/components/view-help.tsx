"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Info, X } from "lucide-react";

type ViewHelpProps = {
  title: string;
  children: ReactNode;
  label?: string;
};

export function ViewHelp({ title, children, label }: ViewHelpProps) {
  const [open, setOpen] = useState(false);
  const canUseDOM = typeof document !== "undefined";

  const helpModal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 backdrop-blur-xl" style={{ backgroundColor: "rgba(0, 0, 0, 0.68)" }} onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-[24px] border shadow-[0_30px_90px_rgba(0,0,0,0.45)]" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
        <div className="bg-[var(--c-surface)] px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <Info size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{title}</p>
            <p className="text-xs mt-1 text-[var(--c-text-muted)]">Un resumen rápido para entender esta vista.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-full p-2 transition-all hover:bg-white/10"
            style={{ color: "var(--c-text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5">
          <div className="rounded-[22px] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm leading-7" style={{ color: "var(--c-text)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 justify-center transition-all active:scale-95 ${label ? "h-10 rounded-full px-3 text-sm font-semibold" : "h-10 w-10 rounded-full"}`}
        style={{ color: "var(--c-text)", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
        aria-label={label ? label : "Ver ayuda"}
      >
        <Info size={18} />
        {label ? <span>{label}</span> : null}
      </button>

      {open && canUseDOM && createPortal(helpModal, document.body)}
    </>
  );
}
