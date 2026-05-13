"use client";

import Link from "next/link";
import { FileText, Calendar, BookOpen, Activity, ArrowRight, Flame, TrendingUp, Clock, Plus, Sparkles } from "lucide-react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSettings } from "@/lib/use-settings";
import { useMemo } from "react";

type CalEvent = { id: string; title: string; date: string; type: string; color?: string };
type Habit = { id: string; name: string; emoji: string; history: Record<string, boolean> };
type Unit = { id: string; subjectId: string; title: string; status: string };
type Subject = { id: string; name: string };

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = fmtKey(today);

  // Próximo evento
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
  const habitsPct = habitsTotal > 0 ? Math.round((habitsTodayDone / habitsTotal) * 100) : 0;

  // Materias
  const learnedUnits = units.filter((u) => u.status === "aprendida").length;
  const totalUnits = units.length;
  const unitsPct = totalUnits > 0 ? Math.round((learnedUnits / totalUnits) * 100) : 0;

  // Global day progress
  const globalPct = habitsTotal > 0 || totalUnits > 0
    ? Math.round(((habitsTodayDone + learnedUnits) / (habitsTotal + totalUnits || 1)) * 100)
    : 0;

  const cards = [
    {
      href: "/notas",
      label: "Notas",
      desc: "Ideas y apuntes",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/8",
      border: "border-blue-500/15",
      iconBg: "bg-blue-500/12",
      stat: null,
    },
    {
      href: "/calendario",
      label: "Calendario",
      desc: nextEvent
        ? `${nextEvent.title}`
        : "Sin eventos próximos",
      icon: Calendar,
      color: "text-rose-400",
      bg: "bg-rose-500/8",
      border: "border-rose-500/15",
      iconBg: "bg-rose-500/12",
      stat: nextEvent
        ? { label: nextEventDiff === 0 ? "Hoy" : `${nextEventDiff}d`, highlight: nextEventDiff === 0 }
        : null,
    },
    {
      href: "/materias",
      label: "Materias",
      desc: `${learnedUnits}/${totalUnits} unidades`,
      icon: BookOpen,
      color: "text-violet-400",
      bg: "bg-violet-500/8",
      border: "border-violet-500/15",
      iconBg: "bg-violet-500/12",
      stat: totalUnits > 0 ? { label: `${unitsPct}%`, highlight: unitsPct === 100 } : null,
    },
    {
      href: "/habitos",
      label: "Hábitos",
      desc: habitsTotal > 0
        ? `${habitsTodayDone}/${habitsTotal} hoy`
        : "Sin hábitos",
      icon: Activity,
      color: "text-amber-400",
      bg: "bg-amber-500/8",
      border: "border-amber-500/15",
      iconBg: "bg-amber-500/12",
      stat: habitsTotal > 0 ? { label: `${habitsPct}%`, highlight: habitsPct === 100 } : null,
    },
  ];

  return (
    <div className="h-full overflow-y-auto scroll-panel">
      <div className="p-5 sm:p-8 flex flex-col gap-6 max-w-2xl mx-auto">

        {/* ── Greeting ── */}
        <div className="flex items-center justify-between pt-1 anim-slide-down">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--c-text)" }}>
              {getGreeting()}, {settings.name.split(" ")[0]}
            </h1>
            <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--c-text-muted)" }}>
              {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
            </p>
          </div>

          {/* Day progress ring */}
          {(habitsTotal > 0 || totalUnits > 0) && (
            <div className="flex-none relative w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--c-border)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.5" fill="none"
                  stroke="url(#progressGrad)" strokeWidth="2.5"
                  strokeDasharray={`${globalPct} ${100 - globalPct}`}
                  strokeLinecap="round"
                  className="transition-all duration-700" />
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: "var(--c-text)" }}>
                {globalPct}%
              </span>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="flex gap-2 anim-slide-up" style={{ animationDelay: "0.05s" }}>
          <Link href="/notas" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", color: "var(--c-text)" }}>
            <Plus size={13} /> Nota
          </Link>
          <Link href="/calendario" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", color: "var(--c-text)" }}>
            <Plus size={13} /> Evento
          </Link>
        </div>

        {/* ── Bento Cards ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {cards.map((card, i) => (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative flex flex-col gap-3 rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] anim-slide-up ${card.border}`}
              style={{ background: "var(--c-glass)", animationDelay: `${0.08 + i * 0.04}s` }}
            >
              {/* Icon + stat */}
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-none`}>
                  <card.icon size={19} className={card.color} />
                </div>
                {card.stat && (
                  <span className={`text-sm font-bold leading-none ${card.stat.highlight ? "text-emerald-400" : card.color}`}>
                    {card.stat.label}
                  </span>
                )}
              </div>

              {/* Label + desc */}
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight" style={{ color: "var(--c-text)" }}>{card.label}</p>
                <p className="text-[11px] mt-0.5 leading-snug line-clamp-2" style={{ color: "var(--c-text-muted)" }}>
                  {card.desc}
                </p>
              </div>

              {/* Arrow on hover */}
              <ArrowRight size={14} className={`${card.color} opacity-0 group-hover:opacity-60 transition-all duration-200 absolute bottom-4 right-4 translate-x-0 group-hover:translate-x-0.5`} />
            </Link>
          ))}
        </div>

        {/* ── Resumen del día ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 anim-slide-up" style={{ animationDelay: "0.25s" }}>
          {/* Próximo evento */}
          <div className="rounded-2xl p-3.5 sm:p-4 flex flex-col gap-1.5 border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center gap-1.5 text-rose-400">
              <Clock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Próximo</span>
            </div>
            <p className="text-xs font-bold truncate" style={{ color: "var(--c-text)" }}>
              {nextEvent?.title ?? "—"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
              {nextEventDiff !== null
                ? nextEventDiff === 0 ? "Hoy" : `En ${nextEventDiff} días`
                : "Sin eventos"}
            </p>
          </div>

          {/* Hábitos hoy */}
          <div className="rounded-2xl p-3.5 sm:p-4 flex flex-col gap-1.5 border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Flame size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Hoy</span>
            </div>
            <p className="text-2xl font-extrabold leading-none" style={{ color: "var(--c-text)" }}>
              {habitsPct}<span className="text-sm">%</span>
            </p>
            <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>hábitos</p>
          </div>

          {/* Progreso materias */}
          <div className="rounded-2xl p-3.5 sm:p-4 flex flex-col gap-1.5 border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center gap-1.5 text-violet-400">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Progreso</span>
            </div>
            <p className="text-2xl font-extrabold leading-none" style={{ color: "var(--c-text)" }}>
              {unitsPct}<span className="text-sm">%</span>
            </p>
            <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>unidades</p>
          </div>
        </div>

        {/* ── Today's habits quick-check ── */}
        {habits.length > 0 && (
          <div className="rounded-2xl p-4 border anim-slide-up flex flex-col gap-3" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
                <Sparkles size={12} className="text-amber-400" /> Hábitos de hoy
              </p>
              <Link href="/habitos" className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                Ver todos →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {habits.slice(0, 6).map((habit) => {
                const done = habit.history[todayKey];
                return (
                  <span key={habit.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      done
                        ? "bg-emerald-500/12 border-emerald-500/25 text-emerald-400"
                        : "border text-zinc-400"
                    }`}
                    style={!done ? { borderColor: "var(--c-border)" } : {}}>
                    <span>{habit.emoji}</span>
                    <span className="truncate max-w-[80px]">{habit.name}</span>
                    {done && <span className="text-emerald-400">✓</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
