"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, BookOpen, GraduationCap, GitBranch, ClipboardCheck, LayoutDashboard, Columns3 } from "lucide-react";

type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  items: { text: string; icon?: React.ElementType }[];
};

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "Mayo 2026",
    title: "Diseño renovado y mejoras",
    items: [
      { text: "Nuevo diseño celeste en todas las páginas", icon: Sparkles },
      { text: "Calendario renovado: vista semana/mes, modal de día, panel de eventos con cuenta regresiva", icon: ClipboardCheck },
      { text: "Clima en el calendario desde Open-Meteo", icon: LayoutDashboard },
      { text: "Notas rediseñadas: diseño de 3 columnas más limpio", icon: Columns3 },
      { text: "Botones + e Info unificados en todas las pantallas", icon: Sparkles },
      { text: "Inicio de sesión con Google sin depender de la base de datos", icon: GraduationCap },
      { text: "Modal de feedback para enviar sugerencias", icon: BookOpen },
      { text: "Correcciones de diseño en iOS y pantallas pequeñas", icon: LayoutDashboard },
    ],
  },
  {
    version: "1.1.0",
    date: "Mayo 2026",
    title: "Plan de estudios",
    items: [
      { text: "Plan completo de Ingeniería en Sistemas de Información (37 materias, 5 años)", icon: GraduationCap },
      { text: "Correlatividades visuales con líneas SVG entre materias", icon: GitBranch },
      { text: "Condiciones de cursada: TPs grupales, cuestionarios y exámenes", icon: ClipboardCheck },
      { text: "Vista de escritorio con columnas por año", icon: Columns3 },
      { text: "Sección Próximos eventos en el inicio", icon: LayoutDashboard },
    ],
  },
];

const STORAGE_KEY = "mo_changelog_seen";
export const LATEST_VERSION = CHANGELOG[0].version;

export function WhatsNew() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    const latest = CHANGELOG[0].version;
    if (seen !== latest) {
      setHasNew(true);
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, CHANGELOG[0].version);
    setOpen(false);
    setHasNew(false);
  };

  const latest = CHANGELOG[0];

  return (
    <>
      {hasNew && (
        <div className="fixed top-3 right-14 sm:right-4 z-50">
          <button
            onClick={() => setOpen(true)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06] active:scale-90"
            style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}
          >
            <Sparkles size={16} className="text-amber-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2" style={{ borderColor: "var(--c-bg)" }} />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />
          <div
            className="relative w-full max-w-sm rounded-3xl p-6 anim-scale-in shadow-[0_20px_60px_rgba(0,0,0,0.5)] border overflow-hidden"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition-all"
              style={{ color: "var(--c-text-muted)" }}
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/15">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: "var(--c-text)" }}>
                  Novedades
                </p>
                <p className="text-[11px] font-medium" style={{ color: "var(--c-text-muted)" }}>
                  {latest.date} · v{latest.version}
                </p>
              </div>
            </div>

            <p className="text-sm font-bold mb-3" style={{ color: "var(--c-text)" }}>
              {latest.title}
            </p>

            <ul className="space-y-2 mb-5">
              {latest.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug" style={{ color: "var(--c-text)" }}>
                    {Icon && (
                      <span className="flex-none mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "var(--c-glass)" }}>
                        <Icon size={12} style={{ color: "var(--c-text-muted)" }} />
                      </span>
                    )}
                    <span className="font-medium">{item.text}</span>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97]"
              style={{ background: "var(--c-border-2)", color: "var(--c-text)" }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
