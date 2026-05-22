"use client";

import Link from "next/link";
import {
  Clock, BookOpen, Activity, Calendar, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSettings } from "@/lib/use-settings";
import { useSound } from "@/lib/use-sound";
import { filterActive } from "@/lib/sync-utils";
import { useMemo } from "react";
import { ICONS_MAP } from "@/lib/materias/constants";
import { getColor, calcAvg, getActualCondition, conditionPillClasses } from "@/lib/materias/utils";
import type { Subject } from "@/types/materias";

type CalEvent = { id: string; title: string; date: string; type: string; color?: string; deletedAt?: string | null };
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

export default function DashboardPage() {
  const [events] = useLocalStorageState<CalEvent[]>("mo_events", []);
  const [subjects] = useLocalStorageState<Subject[]>("mo_subjects", []);
  const [settings] = useSettings();
  const playSound = useSound();

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const activeEvents = useMemo(() => filterActive(events), [events]);
  const activeSubjects = useMemo(() => filterActive(subjects), [subjects]);

  const weekEvents = useMemo(() => {
    const end = new Date(today); end.setDate(end.getDate() + 7);
    return [...activeEvents]
      .filter(e => new Date(`${e.date}T00:00:00`) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(e => {
        const d = new Date(`${e.date}T00:00:00`);
        return d >= today && d <= end;
      });
  }, [activeEvents, today]);

  const diffDays = (date: string) =>
    Math.ceil((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000);

  const subjectConditions = useMemo(() => {
    const map: Record<string, number> = {};
    activeSubjects.forEach(s => {
      const label = getActualCondition(s).label;
      map[label] = (map[label] ?? 0) + 1;
    });
    return map;
  }, [activeSubjects]);

  const todayLabel = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(today);
  const dayName = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

  const eventDates = useMemo(() => new Set(activeEvents.map(e => e.date)), [activeEvents]);

  const calendarGrid = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = (first.getDay() || 7) - 1;
    const days: (number | null)[] = Array(startDay).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [today]);

  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(today);
  const dayHeaders = ["L", "M", "M", "J", "V", "S", "D"];

  const navItems = [
    { href: "/materias", icon: BookOpen, label: "Materias", count: activeSubjects.length, color: "text-violet-400 bg-violet-500/10" },
    { href: "/calendario", icon: Clock, label: "Calendario", count: weekEvents.length, color: "text-rose-400 bg-rose-500/10" },
    { href: "/habitos", icon: Activity, label: "Hábitos", color: "text-amber-400 bg-amber-500/10" },
    { href: "/notas", icon: FileText, label: "Notas", color: "text-blue-400 bg-blue-500/10" },
  ];

  const attendanceRisk = useMemo(() =>
    activeSubjects.filter(s => {
      const total = s.clasesTotal ?? 0;
      const asistidas = s.clasesAsistidas ?? 0;
      const umbral = s.umbralAsistencia ?? 75;
      if (!total) return false;
      return Math.round((asistidas / total) * 100) < umbral;
    }).length,
  [activeSubjects]);

  return (
    <div className="h-full overflow-y-auto scroll-panel pb-20">
      <div className="px-4 sm:px-8 pt-6 w-full max-w-[1400px] mx-auto">
        <div className="mb-5">
          <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--c-text-muted)" }}>{dayName}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none" style={{ color: "var(--c-text)" }}>
            {getGreeting()}, {settings.name.split(" ")[0]}
          </h1>
        </div>

        {/* ── Accesos directos + Mini calendario ── */}
        <div className="flex flex-col md:flex-row gap-4 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-[3]">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => playSound("tap")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 transition-all hover:bg-white/[0.03] active:scale-95"
                style={{ background: "var(--c-surface)", borderColor: "var(--c-border)", minHeight: 88 }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="text-xs font-bold" style={{ color: "var(--c-text-muted)" }}>
                  {item.label}{item.count !== undefined ? ` ${item.count}` : ""}
                </span>
              </Link>
            ))}
          </div>

          {/* ── Mini calendario ── */}
          <Link href="/calendario" onClick={() => playSound("tap")}
            className="md:w-72 rounded-2xl border p-4 transition-all hover:bg-white/[0.02]"
            style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>{monthLabel}</span>
            </div>
            <div className="grid grid-cols-7 gap-0 mb-2">
              {dayHeaders.map((d, i) => (
                <div key={`dh-${i}`} className="text-[9px] font-bold text-center py-0.5" style={{ color: "var(--c-text-muted)" }}>{d}</div>
              ))}
              {calendarGrid.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = day === today.getDate();
                const hasEvent = eventDates.has(dateStr);
                return (
                  <div key={dateStr} className="relative flex items-center justify-center py-0.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isToday ? "bg-[var(--c-text)] text-[var(--c-bg)]" : "hover:bg-white/[0.05]"
                    }`} style={{ color: isToday ? "var(--c-bg)" : "var(--c-text)" }}>
                      {day}
                    </div>
                    {hasEvent && <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400" />}
                  </div>
                );
              })}
            </div>
            {weekEvents.length > 0 && (
              <div className="pt-2 space-y-1" style={{ borderTop: "1px solid var(--c-border)" }}>
                {weekEvents.slice(0, 3).map(e => {
                  const d = diffDays(e.date);
                  return (
                    <div key={e.id} className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold flex-none w-7 text-right ${
                        d === 0 ? "text-rose-400" : d <= 3 ? "text-amber-400" : "text-zinc-400"
                      }`}>{d === 0 ? "Hoy" : `${d}d`}</span>
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--c-text)" }}>{e.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Link>
        </div>

        {/* ── Grid inferior: Materias | Notas ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── Materias ── */}
          <div className="rounded-3xl border p-5" style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Materias</h2>
              <Link href="/materias" className="text-[11px] font-semibold hover:underline" style={{ color: "var(--c-text-muted)" }}>Ver todas</Link>
            </div>
            {activeSubjects.length === 0 ? (
              <Link href="/materias#new" onClick={() => playSound("tap")}
                className="flex items-center justify-center gap-2 py-8 rounded-2xl border border-dashed text-xs font-semibold hover:bg-white/[0.03] transition-all"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
                Crear materia +
              </Link>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {Object.entries(subjectConditions).map(([label, count]) => (
                    <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${conditionPillClasses(label)}`}>
                      {count} {label}
                    </span>
                  ))}
                  {attendanceRisk > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-400">
                      {attendanceRisk} en riesgo
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {activeSubjects.slice(0, 5).map(s => {
                    const c = getColor(s.color);
                    const avg = calcAvg(s.grades);
                    const cond = getActualCondition(s);
                    const IconComp: LucideIcon = (s.icon && ICONS_MAP[s.icon]) ? ICONS_MAP[s.icon]! : BookOpen;
                    return (
                      <Link key={s.id} href="/materias" onClick={() => playSound("tap")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/[0.03] transition-all">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${c.bg}`}>
                          <IconComp size={16} className={c.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{s.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {avg !== null && (
                            <span className={`text-xs font-bold ${
                              avg >= (s.promotionGrade ?? 6) ? "text-emerald-400" : avg >= (s.regularGrade ?? 4) ? "text-amber-400" : "text-rose-400"
                            }`}>{avg}</span>
                          )}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${conditionPillClasses(cond.label)}`}>
                            {cond.label === "Promoción" ? "P" : cond.label === "Regular" ? "R" : cond.label === "Abandono" ? "A" : "L"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {activeSubjects.length > 5 && (
                    <p className="text-[10px] text-center pt-1.5" style={{ color: "var(--c-text-muted)" }}>
                      +{activeSubjects.length - 5} más
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Próximos eventos ── */}
          <div className="rounded-3xl border p-5" style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Próximos eventos</h2>
              <Link href="/calendario" className="text-[11px] font-semibold hover:underline" style={{ color: "var(--c-text-muted)" }}>Ver todos</Link>
            </div>
            {weekEvents.length === 0 ? (
              <Link href="/calendario#new" onClick={() => playSound("tap")}
                className="flex items-center justify-center gap-2 py-8 rounded-2xl border border-dashed text-xs font-semibold hover:bg-white/[0.03] transition-all"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
                <Calendar size={15} /> Crear evento +
              </Link>
            ) : (
              <div className="space-y-1">
                {weekEvents.map(e => {
                  const d = diffDays(e.date);
                  const dayLabel = d === 0 ? "Hoy" : d === 1 ? "Mañana" : `${d}d`;
                  return (
                    <Link key={e.id} href="/calendario" onClick={() => playSound("tap")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/[0.03] transition-all">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: `${e.color ?? "#a78bfa"}18` }}>
                        <Calendar size={16} style={{ color: e.color ?? "#a78bfa" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{e.title}</p>
                        <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                          {new Date(`${e.date}T00:00:00`).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d === 0 ? "bg-rose-500/15 text-rose-400" : d <= 2 ? "bg-amber-500/15 text-amber-400" : "bg-zinc-500/10 text-zinc-400"
                      }`}>{dayLabel}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
