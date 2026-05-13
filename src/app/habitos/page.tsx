"use client";

import { useMemo, useState } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { Activity, Target, Plus, Check, Trash2, X, Flame, ChevronDown, ChevronRight } from "lucide-react";

type HabitColor = "zinc" | "blue" | "emerald" | "violet" | "rose" | "amber";

type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  history: Record<string, boolean>;
};

const HABIT_COLORS: { id: HabitColor; bg: string; text: string; border: string; active: string }[] = [
  { id: "zinc",    bg: "bg-zinc-500/15",    text: "text-zinc-400",    border: "border-zinc-500/25",    active: "bg-zinc-400" },
  { id: "blue",    bg: "bg-blue-500/15",    text: "text-blue-400",    border: "border-blue-500/25",    active: "bg-blue-400" },
  { id: "emerald", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", active: "bg-emerald-400" },
  { id: "violet",  bg: "bg-violet-500/15",  text: "text-violet-400",  border: "border-violet-500/25",  active: "bg-violet-400" },
  { id: "rose",    bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/25",    active: "bg-rose-400" },
  { id: "amber",   bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/25",   active: "bg-amber-400" },
];

const EMOJI_LIST = ["📖", "🏃", "💧", "🧘", "🍏", "💪", "💻", "🎸", "💊", "🧹", "🎨", "💤"];

const initialHabits: Habit[] = [
  { id: "habit-lectura", name: "Lectura", emoji: "📖", color: "blue", history: {} }
];

const createId = () => crypto.randomUUID();

const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getLastDays = (n: number) => {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
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
  const [habits, setHabits] = useLocalStorageState<Habit[]>("mo_habits", initialHabits);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🏃");
  const [newColor, setNewColor] = useState<HabitColor>("amber");

  const todayKey = fmtKey(new Date());
  const habitsTodayDone = habits.filter((h) => h.history[todayKey]).length;
  const heatmapDays = useMemo(() => getLastDays(35), []);

  const handleAdd = () => {
    const t = newName.trim();
    if (!t) return;
    setHabits([...habits, { id: createId(), name: t, emoji: newEmoji, color: newColor, history: {} }]);
    setNewName("");
    setNewEmoji("🏃");
    setNewColor("amber");
    setShowModal(false);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar este hábito?")) return;
    setHabits(habits.filter((h) => h.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleToday = (habitId: string) => {
    setHabits(habits.map((h) =>
      h.id !== habitId ? h : { ...h, history: { ...h.history, [todayKey]: !h.history[todayKey] } }
    ));
  };

  const toggleDay = (habitId: string, dayKey: string) => {
    setHabits(habits.map((h) =>
      h.id !== habitId ? h : { ...h, history: { ...h.history, [dayKey]: !h.history[dayKey] } }
    ));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* ── Modal ── */}
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

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nombre</label>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej: Tomar 2L de agua"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Emoji</label>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_LIST.map(e => (
                    <button key={e} type="button" onClick={() => setNewEmoji(e)}
                      className={`aspect-square rounded-xl text-xl flex items-center justify-center border transition-all ${
                        newEmoji === e ? "scale-110" : "border-transparent opacity-50 hover:opacity-80"
                      }`}
                      style={newEmoji === e ? { background: "var(--c-glass)", borderColor: "var(--c-border-2)" } : {}}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
                <div className="flex gap-3">
                  {HABIT_COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => setNewColor(c.id)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${c.active} ${
                        newColor === c.id ? "scale-110 shadow-md" : "border-transparent opacity-40 hover:opacity-80"
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
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2">
                <Check size={16} /> Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex-none px-4 sm:px-6 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Activity size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Hábitos</p>
            <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>{habitsTodayDone}/{habits.length} completados hoy</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <Plus size={14} /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* ── Habits list ── */}
      <div className="scroll-panel px-4 sm:px-6 py-4 space-y-2">
        {habits.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Target size={24} className="text-amber-400/50" />
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Ningún hábito todavía</p>
            <p className="text-xs max-w-[220px]" style={{ color: "var(--c-text-muted)" }}>Creá tu primer hábito para empezar tu racha.</p>
          </div>
        ) : (
          habits.map((habit) => {
            const isDone = habit.history[todayKey];
            const streak = calcStreak(habit.history);
            const color = HABIT_COLORS.find(c => c.id === habit.color) || HABIT_COLORS[0];
            const isExpanded = expandedId === habit.id;

            return (
              <div key={habit.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isDone ? color.border : ""}`}
                style={{ background: "var(--c-glass)", borderColor: isDone ? undefined : "var(--c-border)" }}>
                {/* Main row: check today + name + streak */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Check button */}
                  <button type="button" onClick={() => toggleToday(habit.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-none border transition-all duration-200 ${
                      isDone
                        ? `${color.bg} ${color.border} ${color.text} anim-check-pop`
                        : "hover:bg-white/[0.04]"
                    }`}
                    style={!isDone ? { borderColor: "var(--c-border)" } : {}}>
                    {isDone ? <Check size={18} strokeWidth={2.5} /> : <span className="text-lg">{habit.emoji}</span>}
                  </button>

                  {/* Name + streak */}
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                    className="flex-1 min-w-0 text-left flex items-center gap-2">
                    <p className={`text-sm font-bold truncate ${isDone ? "line-through opacity-60" : ""}`} style={{ color: "var(--c-text)" }}>
                      {habit.name}
                    </p>
                    {streak > 0 && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold flex-none ${color.bg} ${color.text} ${color.border} border`}>
                        <Flame size={10} /> {streak}
                      </span>
                    )}
                  </button>

                  {/* Expand + delete */}
                  <div className="flex items-center gap-1 flex-none">
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                      className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: heatmap */}
                {isExpanded && (
                  <div className="px-4 pb-4 anim-fade-in" style={{ borderTop: "1px solid var(--c-border)" }}>
                    <div className="flex items-center justify-between py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>
                        Últimos 35 días
                      </p>
                      <button type="button" onClick={() => handleRemove(habit.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2 py-1 transition-all hover:bg-rose-500/10 text-rose-400">
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>

                    {/* Heatmap grid — 7 cols x 5 rows */}
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
                                ? `${color.active} text-white`
                                : isToday
                                  ? "ring-1 ring-amber-400/40"
                                  : ""
                            }`}
                            style={!done ? { background: "var(--c-glass)", color: "var(--c-text-muted)" } : {}}
                            title={`${day.getDate()}/${day.getMonth() + 1} — ${done ? "✓" : "✗"}`}>
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Racha</p>
                        <p className={`text-lg font-extrabold ${color.text}`}>{streak}<span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}> días</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Últimos 7d</p>
                        <p className={`text-lg font-extrabold ${color.text}`}>
                          {heatmapDays.slice(-7).filter(d => habit.history[fmtKey(d)]).length}
                          <span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}> /7</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Total</p>
                        <p className={`text-lg font-extrabold ${color.text}`}>
                          {Object.values(habit.history).filter(Boolean).length}
                          <span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}> días</span>
                        </p>
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
  );
}
