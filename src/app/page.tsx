"use client";

import Link from "next/link";
import { 
  Search, Settings2, Calendar, Activity, 
  ChevronRight, ChevronDown, Flame, BookOpen, Book, Atom,
  Calculator, Globe, Languages, Briefcase, GraduationCap,
  FileText, Clock, Plus, Folder
} from "lucide-react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSettings } from "@/lib/use-settings";
import { useSound } from "@/lib/use-sound";
import { useMemo, useState } from "react";

type CalEvent = { id: string; title: string; date: string; type: string; color?: string };
type Habit = { id: string; name: string; emoji: string; history: Record<string, boolean> };
type Unit = { id: string; subjectId: string; title: string; status: string };
type Subject = { id: string; name: string; color?: string; icon?: string };

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
  const [units] = useLocalStorageState<Unit[]>("mo_units", []);
  const [subjects] = useLocalStorageState<Subject[]>("mo_subjects", []);
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = fmtKey(today);

  // Próximo evento (Examen)
  const nextEvent = useMemo(() =>
    [...events]
      .filter((e) => new Date(`${e.date}T00:00:00`) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  , [events]);

  const nextEventDiff = nextEvent
    ? Math.ceil((new Date(`${nextEvent.date}T00:00:00`).getTime() - today.getTime()) / 86400000)
    : null;

  // Hábitos
  const habitsTodayDone = habits.filter((h) => h.history[todayKey]).length;
  const habitsTotal = habits.length;

  return (
    <div className="h-full overflow-y-auto scroll-panel pb-24">
      {/* ── Search & Header (Mobile style) ── */}
      <div className="p-4 pt-5 pb-2 flex items-center gap-3 anim-slide-down">
        <div className="flex-1 relative">
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

      <div className="px-4 sm:px-5 flex flex-col gap-6 max-w-2xl mx-auto pb-8">
        
        {/* ── Saludo Relajado ── */}
        <div className="pt-2 pb-1 pl-1 anim-fade-in" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--c-text)" }}>
            {getGreeting()}, {settings.name.split(" ")[0]}
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>
            Hoy es {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}.
          </p>
        </div>

        {/* ── Info Importante Directa (Quick Cards) ── */}
        <div className="grid grid-cols-2 gap-3 anim-slide-up" style={{ animationDelay: "0.15s" }}>
          {/* Examen / Próximo Evento */}
          <Link href="/calendario" onClick={() => playSound("tap")}
            className="group relative flex flex-col gap-2 rounded-2xl p-4 border transition-all duration-200 hover:bg-white/[0.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                <Clock size={14} className="text-rose-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Próximo</span>
            </div>
            <div>
              <p className="text-lg font-extrabold leading-tight mt-1 truncate" style={{ color: "var(--c-text)" }}>
                {nextEventDiff !== null ? (nextEventDiff === 0 ? "¡Hoy!" : `${nextEventDiff} días`) : "Libre"}
              </p>
              <p className="text-xs font-medium truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                {nextEvent?.title || "Sin eventos próximos"}
              </p>
            </div>
          </Link>

          {/* Hábitos Completados */}
          <Link href="/habitos" onClick={() => playSound("tap")}
            className="group relative flex flex-col gap-2 rounded-2xl p-4 border transition-all duration-200 hover:bg-white/[0.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Flame size={14} className="text-amber-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Hábitos</span>
            </div>
            <div>
              <p className="text-lg font-extrabold leading-tight mt-1" style={{ color: "var(--c-text)" }}>
                {habitsTodayDone} <span className="text-sm font-semibold opacity-50">/ {habitsTotal}</span>
              </p>
              <p className="text-xs font-medium truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                Completados hoy
              </p>
            </div>
          </Link>
        </div>

        {/* ── Acordeones ── */}
        <div className="space-y-4 anim-slide-up" style={{ animationDelay: "0.2s" }}>
          
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
                {subjects.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-center" style={{ color: "var(--c-text-muted)" }}>
                    No hay materias recientes.
                  </div>
                ) : (
                  subjects.slice(0, 4).map((sub) => (
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
