"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Info, X, ChevronRight, ChevronLeft } from "lucide-react";

export type HelpStep = {
  title: string;
  description: string | ReactNode;
  icon: ReactNode;
};

type ViewHelpProps = {
  title: string;
  label?: string;
  steps?: HelpStep[];
  children?: ReactNode; // Guardamos children para compatibilidad
};

export function ViewHelp({ title, steps, children, label }: ViewHelpProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const canUseDOM = typeof document !== "undefined";

  const isSlider = steps && steps.length > 0;
  const nextStep = () => isSlider && setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => isSlider && setCurrentStep(prev => Math.max(prev - 1, 0));

  const step = isSlider ? steps[currentStep] : null;

  const helpModal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ perspective: "1000px" }}>
      <div className="absolute inset-0 backdrop-blur-xl" style={{ backgroundColor: "rgba(0, 0, 0, 0.68)" }} onClick={() => setOpen(false)} />
      
      <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border shadow-[0_30px_90px_rgba(0,0,0,0.45)] anim-scale-in" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
        {/* Header */}
        <div className="bg-[var(--c-surface)] px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
            <Info size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{title}</p>
            <p className="text-xs mt-1 text-[var(--c-text-muted)] truncate">
              {isSlider ? `Paso ${currentStep + 1} de ${steps.length}` : "Un resumen rápido para entender esta vista."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-full p-2 flex-none transition-all hover:bg-white/10"
            style={{ color: "var(--c-text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Content */}
        {isSlider && step ? (
          <div className="px-6 py-8 flex flex-col items-center justify-center min-h-[260px] text-center bg-[var(--c-bg)]">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border shadow-sm text-sky-400" style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
                  {step.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 leading-tight" style={{ color: "var(--c-text)" }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>{step.description}</p>
          </div>
        ) : (
          <div className="px-5 py-5 bg-[var(--c-bg)]">
            <div className="rounded-[22px] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm leading-7" style={{ color: "var(--c-text)" }}>
              {children}
            </div>
          </div>
        )}

        {/* Footer / Controls */}
        {isSlider && steps && (
          <div className="px-5 py-4 bg-[var(--c-surface)] border-t flex items-center justify-between" style={{ borderColor: "var(--c-border)" }}>
            <button 
              type="button" 
              onClick={prevStep} 
              disabled={currentStep === 0}
              className="p-2.5 rounded-full transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 active:scale-95"
              style={{ color: "var(--c-text)" }}>
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-5 bg-sky-500" : "w-1.5"}`} style={{ background: i !== currentStep ? "var(--c-border)" : undefined }} />
              ))}
            </div>

            {currentStep === steps.length - 1 ? (
               <button 
                  type="button" 
                  onClick={() => setOpen(false)} 
                  className="px-4 py-2 text-xs font-bold rounded-full bg-sky-500 text-white shadow hover:bg-sky-400 active:scale-95 transition-all">
                  ¡Entendido!
               </button>
            ) : (
              <button 
                  type="button" 
                  onClick={nextStep} 
                  className="p-2.5 rounded-full transition-all hover:bg-white/10 active:scale-95"
                  style={{ color: "var(--c-text)" }}>
                  <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => { setCurrentStep(0); setOpen(true); }}
        className={`inline-flex items-center gap-2 justify-center transition-all active:scale-95 ${label ? "h-10 rounded-full px-4 text-[13px] font-bold shadow-sm" : "h-10 w-10 rounded-full"}`}
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
