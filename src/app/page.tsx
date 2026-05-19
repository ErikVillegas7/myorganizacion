"use client";

import Link from "next/link";
import { 
  Search, Settings2, Activity,
  ChevronRight, ChevronDown, Flame, BookOpen, Book, Atom,
  Calculator, Globe, Languages, Briefcase, GraduationCap,
  FileText, Clock
} from "lucide-react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSettings } from "@/lib/use-settings";
import { useSound } from "@/lib/use-sound";
import { filterActive } from "@/lib/sync-utils";
import { useMemo, useState } from "react";
import { ViewHelp } from "@/components/view-help";

type CalEvent = { id: string; title: string; date: string; type: string; color?: string; deletedAt?: string | null };
type Habit = { id: string; name: string; emoji: string; history: Record<string, boolean>; deletedAt?: string | null };
type Subject = { id: string; name: string; color?: string; icon?: string; deletedAt?: string | null };
type Note = { id: string; folderId: string | null; title: string; content: string; updatedAt?: string; pinned?: boolean; deletedAt?: string | null };

const subjectIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen,
  Book,
  Atom,
  Calculator,
  Globe,
  Languages,
  Briefcase,
  GraduationCap,
};

const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

export default function DashboardPage() {
  const [events] = useLocalStorageState<CalEvent[]>("mo_events", []);
  const [habits] = useLocalStorageState<Habit[]>("mo_habits", []);
  const [subjects] = useLocalStorageState<Subject[]>("mo_subjects", []);
  const [notes] = useLocalStorageState<Note[]>("mo_notes", []);
  const [settings] = useSettings();
  const playSound = useSound();

  // Acordeones state
  const [openSections, setOpenSections] = useState({
    recents: true,
    spaces: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    playSound("click");
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);
  const todayKey = fmtKey(today);

  const activeEvents = useMemo(() => filterActive(events), [events]);
  const activeHabits = useMemo(() => filterActive(habits), [habits]);
  const activeSubjects = useMemo(() => filterActive(subjects), [subjects]);
  const activeNotes = useMemo(() => filterActive(notes), [notes]);

  // Próximo evento (Examen)
  const nextEvent = useMemo(() =>
    [...activeEvents]
      .filter((e) => new Date(`${e.date}T00:00:00`) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  , [activeEvents, today]);

  const nextEventDiff = nextEvent
    ? Math.ceil((new Date(`${nextEvent.date}T00:00:00`).getTime() - today.getTime()) / 86400000)
    : null;

  // Hábitos
  const habitsTodayDone = activeHabits.filter((h) => h.history[todayKey]).length;
  const habitsTotal = activeHabits.length;

  return (
    <div className="h-full overflow-y-auto scroll-panel pb-24 lg:pb-10">
      {/* ── Search & Header (Mobile style) ── */}
      <div className="p-4 pt-5 pb-2 lg:px-8 lg:pt-6 lg:pb-4 flex items-center gap-3 anim-slide-down desktop-page-shell">
        <div className="flex-1 relative lg:max-w-xl">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium transition-all"
            style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
            onFocus={() => playSound("tap")}
          />
        </div>
        <Link href="/ajustes" onClick={() => playSound("click")} className="p-2.5 rounded-2xl flex-none border transition-all hover:bg-white/[0.04] active:scale-95" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
          <Settings2 size={18} />
        </Link>
      </div>

      <div className="px-4 sm:px-5 lg:px-8 flex flex-col gap-6 max-w-2xl lg:max-w-6xl mx-auto pb-8">
        
        {/* ── Saludo Relajado ── */}
        <div className="pt-2 pb-1 pl-1 lg:pt-4 anim-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--c-text)" }}>
                {getGreeting()}, {settings.name.split(" ")[0]}
              </h1>
              <p className="text-xs lg:text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
                Hoy es {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}.
              </p>
            </div>
            </div>
          </div>

        {/* ── Accesos Rápidos ── */}
        <div className="flex flex-col gap-3 anim-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Accesos rápidos</p>
            </div>
            <ViewHelp title="Más información" label="Info">
              <p>Usá estos accesos directos para navegar rápido entre Calendario, Hábitos, Materias y Notas.</p>
              <p>Mantené tu rutina organizada y volvé rápido a lo que necesitás.</p>
            </ViewHelp>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {/* Examen / Próximo Evento */}
          <Link href="/calendario" onClick={() => playSound("tap")}
            className="group relative flex flex-col items-center justify-center h-24 rounded-2xl p-2 border transition-all duration-200 hover:bg-white/[0.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                <Clock size={16} className="text-rose-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Calendario</span>
              <p className="text-lg font-black" style={{ color: "var(--c-text)" }}>
                {nextEventDiff !== null ? (nextEventDiff === 0 ? "¡Hoy!" : `${nextEventDiff}d`) : "Libre"}
              </p>
            </div>
          </Link>

          {/* Hábitos */}
          <Link href="/habitos" onClick={() => playSound("tap")}
            className="group relative flex flex-col items-center justify-center h-24 rounded-2xl p-2 border transition-all duration-200 hover:bg-white/[0.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                <Flame size={16} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Hábitos</span>
              <p className="text-lg font-black" style={{ color: "var(--c-text)" }}>{habitsTodayDone}/{habitsTotal}</p>
            </div>
          </Link>

          {/* Materias */}
          <Link href="/materias" onClick={() => playSound("tap")}
            className="group relative flex flex-col items-center justify-center h-24 rounded-2xl p-2 border transition-all duration-200 hover:bg-white/[0.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                <BookOpen size={16} className="text-blue-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Materias</span>
              <p className="text-lg font-black" style={{ color: "var(--c-text)" }}>{activeSubjects.length}</p>
            </div>
          </Link>

          <Link href="/notas" onClick={() => playSound("tap")}
            className="group relative flex flex-col items-center justify-center h-24 rounded-2xl p-2 border transition-all duration-200 hover:bg-white/[0.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-9 h-9 rounded-2xl bg-sky-500/15 flex items-center justify-center">
                <FileText size={16} className="text-sky-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Notas</span>
              <p className="text-lg font-black" style={{ color: "var(--c-text)" }}>{activeNotes.length}</p>
            </div>
          </Link>
        </div>
      </div>

        {/* ── Acordeones ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 anim-slide-up" style={{ animationDelay: "0.2s" }}>
          
          {/* Recientes (Materias) */}
          <div className="rounded-2xl border overflow-hidden transition-all" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
            <button onClick={() => toggleSection('recents')} className="w-full flex items-center justify-between p-4 bg-white/[0.01] active:bg-white/[0.03] transition-all">
              <span className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
                Recientes
              </span>
              <span className="p-1 rounded-md" style={{ color: "var(--c-text-muted)" }}>
                {openSections.recents ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {openSections.recents && (
              <div className="px-2 pb-2 space-y-0.5">
                {activeSubjects.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-center" style={{ color: "var(--c-text-muted)" }}>
                    No hay materias recientes.
                  </div>
                ) : (
                  activeSubjects.slice(0, 4).map((sub) => (
                    <Link key={sub.id} href="/materias" onClick={() => playSound("tap")} className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/[0.04] active:scale-[0.98]">
                      <div className="w-8 h-8 rounded-lg flex flex-none items-center justify-center text-lg" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                        {(() => {
                          const IconComp = sub.icon ? subjectIconMap[sub.icon] : null;
                          if (IconComp) {
                            return <IconComp size={16} className="text-violet-400" />;
                          }
                          return <BookOpen size={16} className="text-violet-400" />;
                        })()}
                      </div>
                      <span className="text-sm font-semibold truncate flex-1" style={{ color: "var(--c-text)" }}>{sub.name}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Espacios (Módulos principales) */}
          <div className="rounded-2xl border overflow-hidden transition-all" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
            <button onClick={() => toggleSection('spaces')} className="w-full flex items-center justify-between p-4 bg-white/[0.01] active:bg-white/[0.03] transition-all">
              <span className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
                Espacios
              </span>
              <span className="p-1 rounded-md" style={{ color: "var(--c-text-muted)" }}>
                {openSections.spaces ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            
            {openSections.spaces && (
              <div className="px-2 pb-2 space-y-0.5">
                <Link href="/notas" onClick={() => playSound("tap")} className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/[0.04] active:scale-[0.98]">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex flex-none items-center justify-center">
                    <FileText size={14} className="text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold truncate flex-1" style={{ color: "var(--c-text)" }}>Todas las Notas</span>
                </Link>
                <Link href="/materias" onClick={() => playSound("tap")} className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/[0.04] active:scale-[0.98]">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex flex-none items-center justify-center">
                    <BookOpen size={14} className="text-violet-400" />
                  </div>
                  <span className="text-sm font-semibold truncate flex-1" style={{ color: "var(--c-text)" }}>Materias</span>
                </Link>
                <Link href="/habitos" onClick={() => playSound("tap")} className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/[0.04] active:scale-[0.98]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex flex-none items-center justify-center">
                    <Activity size={14} className="text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold truncate flex-1" style={{ color: "var(--c-text)" }}>Hábitos Diarios</span>
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
