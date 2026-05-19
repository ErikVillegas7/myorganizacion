"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSession } from "next-auth/react";
import { filterActive, mergeById, normalizeItems, nowIso } from "@/lib/sync-utils";
import { 
  Activity, Target, Plus, Check, Trash2, X, Flame, 
  MoreVertical, Book, Dumbbell, Droplets, Heart, 
  Zap, Monitor, Music, Coffee, Briefcase, PenTool, Moon
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSound } from "@/lib/use-sound";
import { ViewHelp } from "@/components/view-help";

type HabitColor = "zinc" | "blue" | "emerald" | "violet" | "rose" | "amber";

type Habit = {
  id: string;
  name: string;
  emoji?: string; // Deprecated
  icon?: string;
  color: HabitColor;
  history: Record<string, boolean>;
  updatedAt?: string;
  deletedAt?: string | null;
};

const HABIT_COLORS: { id: HabitColor; bg: string; text: string; border: string; active: string }[] = [
  { id: "zinc",    bg: "bg-zinc-500/15",    text: "text-zinc-400",    border: "border-zinc-500/25",    active: "bg-zinc-400" },
  { id: "blue",    bg: "bg-blue-500/15",    text: "text-blue-400",    border: "border-blue-500/25",    active: "bg-blue-400" },
  { id: "emerald", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", active: "bg-emerald-400" },
  { id: "violet",  bg: "bg-violet-500/15",  text: "text-violet-400",  border: "border-violet-500/25",  active: "bg-violet-400" },
  { id: "rose",    bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/25",    active: "bg-rose-400" },
  { id: "amber",   bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/25",   active: "bg-amber-400" },
];

const ICONS_MAP: Record<string, LucideIcon> = {
  Target, Book, Dumbbell, Droplets, Heart, 
  Zap, Flame, Monitor, Music, Coffee, 
  Briefcase, PenTool, Moon, Activity
};
const ICON_NAMES = Object.keys(ICONS_MAP);

const initialHabits: Habit[] = [
  { id: "habit-lectura", name: "Lectura", icon: "Book", color: "blue", history: {} }
];

const createId = () => crypto.randomUUID();

const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Get current week (Monday to Sunday)
const getCurrentWeekDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay() || 7; // 1 (Mon) - 7 (Sun)
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const getHeatmapDays = () => {
  const today = new Date();
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (34 - i));
    return d;
  });
};

const calcStreak = (history: Record<string, boolean>): number => {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (history[fmtKey(d)]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export default function HabitosPage() {
  const [habits, setHabits] = useLocalStorageState<Habit[]>("mo_habits", initialHabits, {
    normalize: normalizeItems,
  });
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef({ habits });
  const [showModal, setShowModal] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#new",
  );
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // New habit state
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Target");
  const [newColor, setNewColor] = useState<HabitColor>("amber");
  
  const playSound = useSound();
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const heatmapDays = useMemo(() => getHeatmapDays(), []);

  useEffect(() => {
    localSnapshot.current = { habits };
  }, [habits]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const loadRemote = async () => {
      try {
        const res = await fetch("/api/habits", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setRemoteReady(true);
          return;
        }
        const data = await res.json();
        const remoteHabits = normalizeItems(
          (Array.isArray(data?.habits) ? data.habits : []) as Habit[],
        );
        const localHabits = normalizeItems(localSnapshot.current.habits);
        const mergedHabits = mergeById(localHabits, remoteHabits);
        const remoteEmpty = remoteHabits.length === 0;
        const localHasData = localHabits.length > 0;

        if (remoteEmpty && localHasData) {
          await fetch("/api/habits", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ habits: localHabits }),
          });
        }

        if (!cancelled) {
          setHabits(mergedHabits);
        }
      } catch {
        // Keep local data if remote sync fails.
      }

      if (!cancelled) setRemoteReady(true);
    };

    void loadRemote();
    return () => {
      cancelled = true;
    };
  }, [status, setHabits]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/habits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habits }),
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [status, remoteReady, habits]);
  
  useEffect(() => {
    if (window.location.hash === "#new") {
      window.history.replaceState(null, "", "/habitos");
    }
  }, []);

  const todayKey = fmtKey(new Date());
  const activeHabits = useMemo(() => filterActive(habits), [habits]);
  const habitsTodayDone = activeHabits.filter((h) => h.history[todayKey]).length;

  const handleAdd = () => {
    const t = newName.trim();
    if (!t) return;
    const now = nowIso();
    setHabits([...habits, { id: createId(), name: t, icon: newIcon, color: newColor, history: {}, updatedAt: now, deletedAt: null }]);
    setNewName("");
    setNewIcon("Target");
    setNewColor("amber");
    setShowModal(false);
    playSound("success");
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar este hábito y todo su progreso?")) return;
    playSound("pop");
    const now = nowIso();
    setHabits(habits.map((h) => h.id === id ? { ...h, deletedAt: now, updatedAt: now } : h));
    setMenuOpenId(null);
  };

  const toggleDay = (habitId: string, dayKey: string) => {
    setHabits(habits.map((h) => {
      if (h.id !== habitId) return h;
      const willBeDone = !h.history[dayKey];
      playSound(willBeDone ? "success" : "pop");
      return { ...h, history: { ...h.history, [dayKey]: willBeDone }, updatedAt: nowIso() };
    }));
  };

  const renderIcon = (habit: Habit) => {
    const IconComponent = habit.icon ? ICONS_MAP[habit.icon] : (habit.emoji ? null : Target);
    if (IconComponent) return <IconComponent size={20} strokeWidth={2} />;
    return <span className="text-lg">{habit.emoji}</span>; // Fallback for old data
  };

  const dayLetters = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* ── Modal de Creación ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content anim-slide-up">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
                <Activity size={16} className="text-amber-400" />
                Nuevo hábito
              </p>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nombre</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej: Tomar 2L de agua"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Icono</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {ICON_NAMES.slice(0, 14).map(iconName => {
                    const IconComp = ICONS_MAP[iconName];
                    return (
                      <button key={iconName} type="button" onClick={() => { playSound("tap"); setNewIcon(iconName); }}
                        className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${
                          newIcon === iconName ? "scale-110 shadow-md text-amber-400" : "border-transparent text-zinc-400 hover:opacity-80"
                        }`}
                        style={newIcon === iconName ? { background: "var(--c-glass)", borderColor: "var(--c-border-2)" } : {}}>
                        <IconComp size={18} strokeWidth={2} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
                <div className="flex gap-3">
                  {HABIT_COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => { playSound("tap"); setNewColor(c.id); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${c.active} ${
                        newColor === c.id ? "scale-110 shadow-md ring-2 ring-offset-2 ring-offset-[var(--c-bg)] ring-[var(--c-text)]" : "border-transparent opacity-40 hover:opacity-80"
                      }`}
                      style={newColor === c.id ? { borderColor: "var(--c-text)" } : {}} />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex gap-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
                Cancelar
              </button>
              <button type="button" onClick={handleAdd}
                className="flex-1 rounded-xl bg-[var(--c-text)] py-2.5 text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
                style={{ color: "var(--c-bg)" }}>
                <Check size={16} strokeWidth={2.5} /> Crear Hábito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex-none px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between z-10 desktop-page-shell" style={{ background: "var(--c-bg)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight leading-none truncate" style={{ color: "var(--c-text)" }}>Hábitos</h1>
            <p className="text-xs mt-1.5 font-medium truncate" style={{ color: "var(--c-text-muted)" }}>{habitsTodayDone} de {activeHabits.length} completados hoy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewHelp title="Ayuda rápida de hábitos" label="Ayuda">
            <p>Agregá hábitos diarios y marcá los completados para mantener constancia.</p>
            <p>Revisá tu progreso semanal y ajustá tus metas según sea necesario.</p>
          </ViewHelp>
          <button type="button" onClick={() => { playSound("click"); setShowModal(true); }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: "var(--c-text)", color: "var(--c-bg)", boxShadow: "0 4px 14px rgba(255,255,255,0.1)" }}>
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Habits list ── */}
      <div className="scroll-panel px-4 sm:px-6 lg:px-8 py-2 pb-32 lg:pb-10">
        <div className="desktop-page-shell grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-start">
        {activeHabits.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-4 lg:col-span-2">
            <div className="w-16 h-16 rounded-3xl bg-[var(--c-glass)] border flex items-center justify-center" style={{ borderColor: "var(--c-border)" }}>
              <Target size={28} className="opacity-40" />
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--c-text)" }}>Ningún hábito todavía</p>
              <p className="text-xs mt-1 max-w-[220px] mx-auto" style={{ color: "var(--c-text-muted)" }}>Creá tu primer hábito para empezar a construir tu rutina semanal.</p>
            </div>
          </div>
        ) : (
          activeHabits.map((habit, index) => {
            const streak = calcStreak(habit.history);
            const color = HABIT_COLORS.find(c => c.id === habit.color) || HABIT_COLORS[0];
            const isMenuOpen = menuOpenId === habit.id;
            const isExpanded = expandedId === habit.id;

            return (
              <div key={habit.id}
                className="relative rounded-[20px] p-4 transition-all duration-300 anim-slide-up"
                style={{ 
                  background: "var(--c-surface)", 
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--shadow)",
                  animationDelay: `${index * 0.05}s`
                }}>
                
                {/* Cabecera del Hábito */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center flex-none ${color.bg} ${color.text}`}>
                      {renderIcon(habit)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold leading-tight" style={{ color: "var(--c-text)" }}>{habit.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Flame size={12} className={streak > 0 ? "text-amber-500" : "text-zinc-500 opacity-50"} />
                        <span className="text-[11px] font-semibold" style={{ color: streak > 0 ? "var(--c-text)" : "var(--c-text-muted)" }}>
                          {streak} días seguidos
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menú de opciones */}
                  <div className="relative">
                    <button onClick={() => { playSound("click"); setMenuOpenId(isMenuOpen ? null : habit.id); }} className="p-2 rounded-xl transition-all hover:bg-white/[0.04]" style={{ color: "var(--c-text-muted)" }}>
                      <MoreVertical size={18} />
                    </button>
                    {isMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute top-10 right-0 z-40 w-36 rounded-xl p-1 shadow-lg border anim-scale-in origin-top-right"
                          style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
                          <button onClick={() => handleRemove(habit.id)} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all">
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Semana actual (7 días) */}
                <div className="flex items-center justify-between px-1">
                  {weekDays.map((day, i) => {
                    const key = fmtKey(day);
                    const done = habit.history[key];
                    const isToday = key === todayKey;
                    
                    return (
                      <div key={key} className="flex flex-col items-center gap-1.5">
                        <span className="text-[9px] font-bold tracking-wide" style={{ color: isToday ? "var(--c-text)" : "var(--c-text-muted)" }}>
                          {dayLetters[i]}
                        </span>
                        <button 
                          onClick={() => toggleDay(habit.id, key)}
                          className={`w-9 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                            done 
                              ? `${color.active} text-[var(--c-bg)] shadow-[0_4px_12px_rgba(0,0,0,0.15)] anim-check-pop scale-105` 
                              : "hover:bg-white/[0.04] active:scale-90"
                          }`}
                          style={!done ? { border: isToday ? `1px solid ${color.text}` : "1px solid var(--c-border)", background: isToday ? color.bg : "var(--c-glass)" } : {}}>
                          {done && <Check size={16} strokeWidth={3} />}
                          {!done && isToday && <span className="w-1 h-1 rounded-full bg-current opacity-50" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Botón Ver Historial */}
                <button 
                  onClick={() => { playSound("click"); setExpandedId(isExpanded ? null : habit.id); }}
                  className="w-full mt-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}
                >
                  {isExpanded ? "Ocultar Historial" : "Ver Historial Completo"}
                </button>

                {/* Heatmap (35 days) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 anim-slide-up" style={{ borderTop: "1px solid var(--c-border)" }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-text-muted)" }}>Últimos 35 días</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {heatmapDays.map((day) => {
                        const key = fmtKey(day);
                        const done = habit.history[key];
                        const isToday = key === todayKey;
                        return (
                          <button key={key} type="button"
                            onClick={() => toggleDay(habit.id, key)}
                            className={`heatmap-cell aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${
                              done
                                ? `${color.active} text-white shadow-sm scale-105`
                                : isToday
                                  ? "ring-1 ring-amber-400/40"
                                  : "hover:bg-white/[0.04]"
                            }`}
                            style={!done ? { background: "var(--c-glass)", color: "var(--c-text-muted)" } : {}}
                            title={`${day.getDate()}/${day.getMonth() + 1}`}>
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex-1 bg-[var(--c-glass)] border rounded-xl p-2.5 text-center" style={{ borderColor: "var(--c-border)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Racha Total</p>
                        <p className={`text-lg font-extrabold ${color.text}`}>{streak}</p>
                      </div>
                      <div className="flex-1 bg-[var(--c-glass)] border rounded-xl p-2.5 text-center" style={{ borderColor: "var(--c-border)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Histórico</p>
                        <p className={`text-lg font-extrabold ${color.text}`}>{Object.values(habit.history).filter(Boolean).length}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
}
