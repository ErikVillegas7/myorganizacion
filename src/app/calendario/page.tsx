"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSession } from "next-auth/react";
import { filterActive, mergeById, normalizeItems, nowIso } from "@/lib/sync-utils";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Clock, Info, X,
  CalendarDays, ListTodo, CloudSun,
} from "lucide-react";
import { useSound } from "@/lib/use-sound";

type EventType = "examen" | "entrega" | "cuestionario" | "otro";
type EventColor = "rose" | "pink" | "yellow" | "amber" | "sky" | "emerald" | "violet";

type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: EventType;
  color?: EventColor;
  updatedAt?: string;
  deletedAt?: string | null;
};

const createId = () => crypto.randomUUID();
const fmtKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtShort = (d: Date) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(d);
const fmtLong = (d: Date) => d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const eventTypes: { id: EventType; label: string; icon: string }[] = [
  { id: "examen", label: "Examen", icon: "📝" },
  { id: "entrega", label: "Entrega", icon: "📦" },
  { id: "cuestionario", label: "Cuestionario", icon: "❓" },
  { id: "otro", label: "Otro", icon: "📌" },
];

const colorStyles: Record<EventColor, { dot: string; bg: string; text: string; hex: string }> = {
  rose:    { dot: "bg-rose-500",    bg: "bg-rose-500/15",    text: "text-rose-400",    hex: "#f43f5e" },
  pink:    { dot: "bg-pink-500",    bg: "bg-pink-500/15",    text: "text-pink-400",    hex: "#ec4899" },
  yellow:  { dot: "bg-yellow-500",  bg: "bg-yellow-500/15",  text: "text-yellow-400",  hex: "#eab308" },
  amber:   { dot: "bg-amber-500",   bg: "bg-amber-500/15",   text: "text-amber-400",   hex: "#f59e0b" },
  sky:     { dot: "bg-sky-500",     bg: "bg-sky-500/15",     text: "text-sky-400",     hex: "#0ea5e9" },
  emerald: { dot: "bg-emerald-500", bg: "bg-emerald-500/15", text: "text-emerald-400", hex: "#10b981" },
  violet:  { dot: "bg-violet-500",  bg: "bg-violet-500/15",  text: "text-violet-400",  hex: "#8b5cf6" },
};

const helpSteps = [
  { icon: <CalendarDays size={24} />, title: "No te olvides nada", desc: "Agregá fechas importantes de tu cursada: exámenes, entregas, o lo que quieras." },
  { icon: <Clock size={24} />, title: "Seguí el cronograma", desc: "Vista de mes para planificar y scroll horizontal de días en mobile." },
  { icon: <ListTodo size={24} />, title: "Eventos del día", desc: "Tocá un día para ver sus eventos. Podés editarlos o crear uno nuevo." },
];

export default function CalendarioPage() {
  const [events, setEvents] = useLocalStorageState<CalendarEvent[]>("mo_events", [], { normalize: normalizeItems });
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef({ events });
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState<EventType>("examen");
  const [formColor, setFormColor] = useState<EventColor>("rose");
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpStep, setHelpStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const weekRef = useRef<HTMLDivElement>(null);
  const playSound = useSound();

  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=-31.41&longitude=-64.19&current_weather=true&timezone=America/Argentina/Cordoba")
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.current_weather) setWeather({ temp: Math.round(d.current_weather.temperature), code: d.current_weather.weathercode }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);



  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const todayKey = useMemo(() => fmtKey(new Date()), []);

  useEffect(() => { localSnapshot.current = { events }; }, [events]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (sessionStorage.getItem("mo_cleared_all")) { sessionStorage.removeItem("mo_cleared_all"); setRemoteReady(true); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/calendar", { cache: "no-store" });
        if (!res.ok) { if (!cancelled) setRemoteReady(true); return; }
        const data = await res.json();
        const remote = normalizeItems((Array.isArray(data?.events) ? data.events : []) as CalendarEvent[]);
        const local = normalizeItems(localSnapshot.current.events);
        const merged = mergeById(local, remote);
        if (remote.length === 0 && local.length > 0)
          await fetch("/api/calendar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events: local }) });
        if (!cancelled) setEvents(merged);
      } catch { /* keep local */ }
      if (!cancelled) setRemoteReady(true);
    };
    void load();
    return () => { cancelled = true; };
  }, [status, setEvents]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const t = window.setTimeout(() => {
      void fetch("/api/calendar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events }) });
    }, 600);
    return () => window.clearTimeout(t);
  }, [status, remoteReady, events]);

  useEffect(() => {
    if (!isMobile || !weekRef.current || viewMode !== "week") return;
    const el = weekRef.current;
    const todayEl = el.querySelector("[data-today]") as HTMLElement;
    if (todayEl && !el.dataset.scrolled) {
      el.scrollTo({ left: Math.max(0, todayEl.offsetLeft - el.clientWidth / 2 + todayEl.offsetWidth / 2), behavior: "smooth" });
      el.dataset.scrolled = "true";
    }
  }, [isMobile, viewMode]);

  const activeEvents = useMemo(() => filterActive(events), [events]);
  const byDate = useMemo(() => activeEvents.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    acc[e.date] = acc[e.date] ? [...acc[e.date], e] : [e];
    return acc;
  }, {}), [activeEvents]);

  const viewDate = new Date();
  viewDate.setMonth(viewDate.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const calDays: Array<number | null> = [];
  for (let i = 0; i < startDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const scrollDays = Array.from({ length: 45 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() + (i - 15));
    return day;
  });

  const selectedEvents = selectedDate ? byDate[selectedDate] ?? [] : [];
  const getStyle = (e: CalendarEvent) => colorStyles[e.color ?? "rose"];

  const scrollToToday = () => {
    setMonthOffset(0);
    if (isMobile && viewMode === "week" && weekRef.current) {
      const el = weekRef.current;
      const todayEl = el.querySelector("[data-today]") as HTMLElement;
      if (todayEl) {
        el.scrollTo({ left: Math.max(0, todayEl.offsetLeft - el.clientWidth / 2 + todayEl.offsetWidth / 2), behavior: "smooth" });
      }
    }
    setSelectedDate(todayKey);
    setDayModalOpen(true);
  };

  const openNew = (date?: string) => {
    playSound("tap");
    setEditId(null);
    setFormTitle("");
    setFormDesc("");
    setFormDate(date ?? "");
    setFormType("examen");
    setFormColor("rose");
    setModalOpen(true);
  };

  const openEdit = (e: CalendarEvent) => {
    playSound("tap");
    setEditId(e.id);
    setFormTitle(e.title);
    setFormDesc(e.description ?? "");
    setFormDate(e.date);
    setFormType(e.type);
    setFormColor(e.color ?? "rose");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formDate) return;
    playSound("success");
    const now = nowIso();
    if (editId) {
      setEvents(events.map(ev => ev.id === editId ? { ...ev, title: formTitle.trim(), description: formDesc.trim() || undefined, date: formDate, type: formType, color: formColor, updatedAt: now } : ev));
    } else {
      setEvents([...events, { id: createId(), title: formTitle.trim(), description: formDesc.trim() || undefined, date: formDate, type: formType, color: formColor, updatedAt: now, deletedAt: null }]);
    }
    setSelectedDate(formDate);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("¿Eliminar evento?")) return;
    playSound("pop");
    setEvents(events.map(ev => ev.id === id ? { ...ev, deletedAt: nowIso(), updatedAt: nowIso() } : ev));
  };

  const dayEventsPanel = (
    <div className={!isMobile ? "lg:sticky lg:top-4" : ""}>
      <div className={!isMobile ? "p-4 rounded-2xl" : ""} style={!isMobile ? { background: "var(--c-surface)", border: "1px solid var(--c-border)" } : {}}>
        <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
          <Clock size={12} /> Próximos
        </h2>
        <div className="space-y-2">
          {(() => {
            const now = new Date();
            const upcoming = [...activeEvents]
              .map(e => ({ ev: e, diff: Math.ceil((new Date(`${e.date}T00:00:00`).getTime() - now.getTime()) / 86400000) }))
              .filter(x => x.diff >= 0)
              .sort((a, b) => a.diff - b.diff)
              .slice(0, 10);
            return upcoming.length === 0 ? (
              <div className="py-8 text-center rounded-xl border border-dashed" style={{ borderColor: "var(--c-border)" }}>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>No hay eventos próximos</p>
              </div>
            ) : (
              <>
                {upcoming.map(({ ev, diff }, i) => {
                  const s = getStyle(ev);
                  const eDate = new Date(`${ev.date}T00:00:00`);
                  const urgencyColor = diff === 0 ? "#ef4444" : diff === 1 ? "#f97316" : diff <= 3 ? "#eab308" : diff <= 7 ? "#84cc16" : "var(--c-text-muted)";
                  return (
                    <div key={ev.id} role="button" tabIndex={0} onClick={() => openEdit(ev)}
                      onKeyDown={e => { if (e.key === "Enter") openEdit(ev); }}
                      className="relative rounded-2xl p-3.5 transition-all cursor-pointer text-left overflow-hidden"
                      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: s.hex }} />
                      <div className="flex items-start gap-3 relative z-10">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
                            {eventTypes.find(t => t.id === ev.type)?.icon} {ev.type}
                          </span>
                          <p className="text-xs font-bold mt-1 mb-0.5 truncate" style={{ color: "var(--c-text)" }}>{ev.title}</p>
                          <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{fmtShort(eDate)}</p>
                        </div>
                        <div className="flex flex-col items-center shrink-0 pl-2 border-l" style={{ borderColor: "var(--c-border)" }}>
                          {diff === 0 ? (
                            <span className="text-xs font-black" style={{ color: urgencyColor }}>Hoy</span>
                          ) : diff === 1 ? (
                            <span className="text-xs font-black" style={{ color: urgencyColor }}>Mañana</span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-lg font-black leading-none" style={{ color: urgencyColor }}>{diff}</span>
                              <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>días</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-none px-4 sm:px-6 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-2 min-w-0">
            {weather && (
              <div className="flex items-center gap-1.5 shrink-0">
                <CloudSun size={18} className="text-yellow-400" />
                <span className="text-sm font-extrabold tabular-nums" style={{ color: "var(--c-text)" }}>{weather.temp}°</span>
              </div>
            )}
            {isMobile && (
              <div className="flex items-center gap-0.5 ml-1.5 border-l pl-2" style={{ borderColor: "var(--c-border)" }}>
                <button type="button" onClick={() => setViewMode("week")}
                  className={`py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${viewMode === "week" ? "bg-sky-500 text-white" : ""}`}
                  style={viewMode !== "week" ? { color: "var(--c-text-muted)" } : {}}>
                  Semana
                </button>
                <button type="button" onClick={() => setViewMode("month")}
                  className={`py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${viewMode === "month" ? "bg-sky-500 text-white" : ""}`}
                  style={viewMode !== "month" ? { color: "var(--c-text-muted)" } : {}}>
                  Mes
                </button>
              </div>
            )}
          </div>
          <span className="hidden sm:block text-xs font-bold capitalize px-2 py-0.5 rounded-lg" style={{ background: "var(--c-glass)", color: "var(--c-text-muted)", border: "1px solid var(--c-border)" }}>
            {viewDate.toLocaleString("es-AR", { month: "long", year: "numeric" })}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => { setHelpStep(0); setShowHelp(true); }}
              className="h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-95" style={{ color: "var(--c-text)", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
              <Info size={18} />
            </button>
            <button type="button" onClick={() => openNew()}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 bg-sky-500 text-white shadow-lg shadow-sky-500/20">
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-panel px-4 sm:px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-6 lg:items-start">

            {/* Calendar */}
            <div>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setMonthOffset(monthOffset - 1)}
                  className="p-1.5 rounded-lg transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={scrollToToday}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all hover:bg-white/[0.05]"
                    style={{ color: "var(--c-text-muted)" }}>Hoy</button>
                </div>
                <button type="button" onClick={() => setMonthOffset(monthOffset + 1)}
                  className="p-1.5 rounded-lg transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Mobile: week view */}
              {isMobile && viewMode === "week" ? (
                <>
                  <div className="text-center mb-2">
                    <span className="inline-block text-[10px] font-bold capitalize px-2 py-0.5 rounded-lg" style={{ background: "var(--c-glass)", color: "var(--c-text-muted)", border: "1px solid var(--c-border)" }}>
                      {scrollDays[0].toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                      {scrollDays[0].getMonth() !== scrollDays[scrollDays.length - 1].getMonth() && (
                        <> – {scrollDays[scrollDays.length - 1].toLocaleDateString("es-AR", { month: "long" })}</>
                      )}
                    </span>
                  </div>
                <div ref={weekRef} className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory scroll-smooth py-3 mb-4"
                  style={{ scrollbarWidth: "none" }}>
                  {scrollDays.map(day => {
                    const key = fmtKey(day);
                    const dayEvts = byDate[key] ?? [];
                    const isT = key === todayKey;
                    const isSel = key === selectedDate;
                    const dayLabel = day.toLocaleDateString("es-AR", { weekday: "short" }).slice(0, 3);
                    return (
                      <button key={key} type="button" data-today={isT || undefined}
                        onClick={() => { setSelectedDate(key); setDayModalOpen(true); }}
                        className={`snap-center shrink-0 w-14 flex flex-col items-center gap-0.5 rounded-2xl py-3 transition-all active:scale-95 ${
                          isSel ? "bg-sky-500 text-white shadow-md scale-110" : "hover:bg-white/[0.04]"
                        }`}
                        style={!isSel ? { color: "var(--c-text)", border: isT ? "1px solid var(--c-border)" : "1px solid transparent" } : {}}>
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">{dayLabel}</span>
                        <span className="text-base font-bold">{day.getDate()}</span>
                        {dayEvts.length > 0 && (
                          <div className="flex gap-0.5">
                            {dayEvts.slice(0, 3).map((e, i) => (
                              <div key={i} className={`w-1 h-1 rounded-full ${getStyle(e).dot} ${isSel ? "bg-white" : ""}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                </>
              ) : (
                /* Month grid */
                <div className="p-2 sm:p-5 rounded-2xl mb-4" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                  <div className="grid grid-cols-7 gap-px sm:gap-1.5 mb-1.5">
                    {dayLabels.map(l => (
                      <div key={l} className="text-center text-[9px] font-bold uppercase tracking-wider py-1" style={{ color: "var(--c-text-muted)" }}>{l}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px sm:gap-1">
                    {calDays.map((day, idx) => {
                      if (!day) return <div key={`e${idx}`} />;
                      const key = fmtKey(new Date(year, month, day));
                      const dayEvts = byDate[key] ?? [];
                      const isT = key === todayKey;
                      const isSel = key === selectedDate;
                      return (
                        <button key={key} type="button" onClick={() => { setSelectedDate(key); setDayModalOpen(true); }}
                          className={`rounded-xl flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 ${
                            isSel ? "bg-sky-500 text-white font-bold shadow-sm z-10" : isT ? "ring-1 ring-sky-400/50" : "hover:bg-white/[0.04]"
                          }`}
                          style={Object.assign({ aspectRatio: "1", minHeight: isMobile ? undefined : "60px" }, !isSel ? { color: "var(--c-text)" } : {})}>
                          <span className="text-xs sm:text-sm">{day}</span>
                          {dayEvts.length > 0 && (
                            <div className="flex gap-px sm:gap-0.5">
                              {dayEvts.slice(0, 3).map((e, i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${getStyle(e).dot} ${isSel ? "bg-white" : ""}`} />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* On mobile, day events show below the calendar */}
              {isMobile && dayEventsPanel}
            </div>

            {/* On desktop, day events panel on the right */}
            {!isMobile && dayEventsPanel}
          </div>
        </div>
      </div>

      {/* Event modal — outside overflow-hidden so fixed works on mobile */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden anim-slide-up"
            style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{editId ? "Editar evento" : "Nuevo evento"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded-lg transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Título del evento"
                className="w-full rounded-xl px-3.5 py-3 text-base font-bold focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} placeholder="Descripción (opcional)"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Fecha</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none transition-all [color-scheme:dark]"
                    style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Tipo</label>
                  <select value={formType} onChange={e => setFormType(e.target.value as EventType)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none transition-all [color-scheme:dark]"
                    style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}>
                    {eventTypes.map(t => <option key={t.id} value={t.id} className="text-sm font-bold bg-[#1a1a2e] text-white">{t.icon} {t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
                <div className="flex gap-3">
                  {(Object.entries(colorStyles) as [EventColor, typeof colorStyles.rose][]).map(([id, c]) => (
                    <button key={id} type="button" onClick={() => setFormColor(id)}
                      className={`w-7 h-7 rounded-full transition-all ${c.dot} ${
                        formColor === id ? "scale-110 ring-2 ring-offset-2 ring-sky-400 ring-offset-[var(--c-bg)]" : "opacity-40 hover:opacity-80"
                      }`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 pt-1">
              <button type="button" onClick={handleSave}
                className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/15 hover:bg-sky-400 transition-all active:scale-95">
                {editId ? "Guardar cambios" : "Crear evento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day modal — outside overflow-hidden */}
      {dayModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/50" onClick={() => setDayModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden anim-slide-up"
            style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{fmtLong(new Date(selectedDate + "T00:00:00"))}</h2>
              <button type="button" onClick={() => setDayModalOpen(false)} className="p-1 rounded-lg transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="space-y-2">
                {selectedEvents.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed" style={{ borderColor: "var(--c-border)" }}>
                    <p className="text-xs mb-3" style={{ color: "var(--c-text-muted)" }}>No hay eventos este día</p>
                    <button type="button" onClick={() => { setDayModalOpen(false); openNew(selectedDate); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 transition-all active:scale-95">
                      <Plus size={12} /> Crear evento
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedEvents.map(ev => {
                      const s = getStyle(ev);
                      return (
                        <div key={ev.id} role="button" tabIndex={0} onClick={() => { setDayModalOpen(false); openEdit(ev); }}
                          onKeyDown={e => { if (e.key === "Enter") { setDayModalOpen(false); openEdit(ev); } }}
                          className="relative rounded-2xl p-3.5 transition-all cursor-pointer text-left overflow-hidden"
                          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: s.hex }} />
                          <div className="flex items-start gap-3 relative z-10">
                            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${s.dot}`} />
                            <div className="flex-1 min-w-0">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
                                {eventTypes.find(t => t.id === ev.type)?.icon} {ev.type}
                              </span>
                              <p className="text-xs font-bold mt-1 mb-0.5" style={{ color: "var(--c-text)" }}>{ev.title}</p>
                              {ev.description && <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: "var(--c-text-muted)" }}>{ev.description}</p>}
                            </div>
                            <button type="button" onClick={e => { e.stopPropagation(); setDayModalOpen(false); handleDelete(ev.id); }}
                              className="p-1.5 rounded-md transition-all hover:text-rose-400 hover:bg-rose-500/10 shrink-0" style={{ color: "var(--c-text-muted)" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" onClick={() => { setDayModalOpen(false); openNew(selectedDate); }}
                      className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/[0.03] border border-dashed"
                      style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)" }}>
                      + Agregar evento
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help slider — outside overflow-hidden */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/50" onClick={() => setShowHelp(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden anim-slide-up"
            style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <h3 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Calendario</h3>
              <button type="button" onClick={() => setShowHelp(false)} className="p-1 rounded-lg transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-6 flex flex-col items-center text-center gap-4 min-h-[200px]">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                {helpSteps[helpStep].icon}
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--c-text)" }}>{helpSteps[helpStep].title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-muted)" }}>{helpSteps[helpStep].desc}</p>
              </div>
            </div>
            <div className="px-5 pb-5 flex items-center justify-between">
              <button type="button" onClick={() => setHelpStep(s => Math.max(0, s - 1))}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover:bg-white/[0.05] disabled:opacity-30"
                style={{ color: "var(--c-text-muted)" }} disabled={helpStep === 0}>
                Anterior
              </button>
              <div className="flex gap-1.5">
                {helpSteps.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === helpStep ? "bg-sky-400 w-3" : "opacity-30"}`} style={{ background: i === helpStep ? undefined : "var(--c-text-muted)" }} />
                ))}
              </div>
              <button type="button" onClick={() => {
                if (helpStep < helpSteps.length - 1) setHelpStep(s => s + 1);
                else setShowHelp(false);
              }} className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover:bg-white/[0.05]"
                style={{ color: "var(--c-text)" }}>
                {helpStep < helpSteps.length - 1 ? "Siguiente" : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
