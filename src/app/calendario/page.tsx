"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSession } from "next-auth/react";
import { filterActive, mergeById, normalizeItems, nowIso } from "@/lib/sync-utils";
import {
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Edit2,
  X,
} from "lucide-react";
import { useSound } from "@/lib/use-sound";
import { ViewHelp } from "@/components/view-help";

type EventType = "examen" | "entrega" | "cuestionario" | "otro";
type EventColor = "rose" | "pink" | "amber" | "sky" | "emerald" | "violet";

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

const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const colorOptions: {
  id: EventColor;
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
  hex: string;
}[] = [
  { id: "rose",    label: "Rojo",       dot: "bg-rose-500",    bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/25", hex: "#f43f5e" },
  { id: "pink",    label: "Rosa",       dot: "bg-pink-500",    bg: "bg-pink-500/15",    text: "text-pink-400",    border: "border-pink-500/25", hex: "#ec4899" },
  { id: "amber",   label: "Amarillo",   dot: "bg-amber-500",   bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/25", hex: "#fbbf24" },
  { id: "emerald", label: "Verde",      dot: "bg-emerald-500", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", hex: "#10b981" },
  { id: "sky",     label: "Celeste",    dot: "bg-sky-500",     bg: "bg-sky-500/15",     text: "text-sky-400",     border: "border-sky-500/25", hex: "#0ea5e9" },
  { id: "violet",  label: "Violeta",    dot: "bg-violet-500",  bg: "bg-violet-500/15",  text: "text-violet-400",  border: "border-violet-500/25", hex: "#8b5cf6" },
];

const initialEvents: CalendarEvent[] = [{
  id: "evento-demo",
  title: "Examen de Matemática",
  description: "Repasar integrales y derivadas antes del parcial.",
  date: new Date().toISOString().slice(0, 10),
  type: "examen",
  color: "rose",
}];

const eventTypeOptions: { id: EventType; label: string; icon: string }[] = [
  { id: "examen", label: "Examen", icon: "📝" },
  { id: "entrega", label: "Entrega", icon: "📦" },
  { id: "cuestionario", label: "Cuestionario", icon: "❓" },
  { id: "otro", label: "Otro", icon: "📌" },
];

const createId = () => crypto.randomUUID();

const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtShort = (d: Date) =>
  new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(d);

export default function CalendarioPage() {
  const [events, setEvents] = useLocalStorageState<CalendarEvent[]>("mo_events", initialEvents, {
    normalize: normalizeItems,
  });
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef({ events });
  const [monthOffset, setMonthOffset] = useState(0);
  const [showNewModal, setShowNewModal] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#new",
  );
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState<EventType>("examen");
  const [newColor, setNewColor] = useState<EventColor>("rose");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const playSound = useSound();

  useEffect(() => {
    localSnapshot.current = { events };
  }, [events]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const loadRemote = async () => {
      try {
        const res = await fetch("/api/calendar", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setRemoteReady(true);
          return;
        }
        const data = await res.json();
        const remoteEvents = normalizeItems(
          (Array.isArray(data?.events) ? data.events : []) as CalendarEvent[],
        );
        const localEvents = normalizeItems(localSnapshot.current.events);
        const mergedEvents = mergeById(localEvents, remoteEvents);
        const remoteEmpty = remoteEvents.length === 0;
        const localHasData = localEvents.length > 0;

        if (remoteEmpty && localHasData) {
          await fetch("/api/calendar", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ events: localEvents }),
          });
        }

        if (!cancelled) {
          setEvents(mergedEvents);
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
  }, [status, setEvents]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [status, remoteReady, events]);

  useEffect(() => {
    const updateView = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      setShowMonthCalendar(!mobile);
    };
    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  useEffect(() => {
    if (window.location.hash === "#new") {
      window.history.replaceState(null, "", "/calendario");
    }
  }, []);

  const viewDate = new Date();
  viewDate.setMonth(viewDate.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const calDays: Array<number | null> = [];
  for (let i = 0; i < startDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const activeEvents = useMemo(() => filterActive(events), [events]);

  const byDate = activeEvents.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    acc[e.date] = acc[e.date] ? [...acc[e.date], e] : [e];
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = fmtKey(today);

  const weekStart = new Date(today);
  const weekStartOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - weekStartOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const upcoming = [...activeEvents]
    .filter((e) => new Date(`${e.date}T00:00:00`) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const selectedEvent = detailEventId ? activeEvents.find((e) => e.id === detailEventId) : null;

  const play = useCallback((type: "success" | "pop" | "click" | "tap") => {
    // Read directly from localStorage to ensure global sync without full re-renders
    const stored = window.localStorage.getItem("mo_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.soundEnabled === false) return;
      } catch {}
    }
    playSound(type);
  }, [playSound]);

  const resetEventForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewDate("");
    setNewType("examen");
    setNewColor("rose");
    setEditingEventId(null);
  };

  const openNewEvent = (date?: string) => {
    play("tap");
    resetEventForm();
    setDetailEventId(null);
    setNewDate(date ?? "");
    setShowNewModal(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    play("tap");
    setDetailEventId(null);
    setEditingEventId(event.id);
    setNewTitle(event.title);
    setNewDescription(event.description ?? "");
    setNewDate(event.date);
    setNewType(event.type);
    setNewColor(event.color ?? "rose");
    setShowNewModal(true);
  };

  const openEventDetail = (event: CalendarEvent) => {
    play("tap");
    setDetailEventId(event.id);
    setShowNewModal(false);
  };

  const handleSave = () => {
    if (!newTitle.trim() || !newDate) return;
    play("success");
    const now = nowIso();

    if (editingEventId) {
      setEvents(events.map((ev) => ev.id === editingEventId ? {
        ...ev,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        date: newDate,
        type: newType,
        color: newColor,
        updatedAt: now,
      } : ev));
    } else {
      setEvents([
        ...events,
        {
          id: createId(),
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          date: newDate,
          type: newType,
          color: newColor,
          updatedAt: now,
          deletedAt: null,
        },
      ]);
    }

    resetEventForm();
    setShowNewModal(false);
  };

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if (!window.confirm("¿Seguro que querés eliminar este evento?")) return;
    playSound("pop");
    const now = nowIso();
    setEvents(events.map((ev) => ev.id === id ? { ...ev, deletedAt: now, updatedAt: now } : ev));
  };

  const getStyle = (e: CalendarEvent) => {
    if (e.color) {
      const f = colorOptions.find((c) => c.id === e.color);
      if (f) return f;
    }
    return colorOptions[0];
  };

  const getCountdownColor = (diff: number) => {
    if (diff <= 5) return "#f43f5e";
    if (diff < 10) return "#f59e0b";
    return "var(--c-text)";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      
      {/* ── Header Principal ── */}
      <div className="flex-none px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between z-10 desktop-page-shell" style={{ background: "var(--c-bg)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0 flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight leading-none truncate" style={{ color: "var(--c-text)" }}>Calendario</h1>
              <p className="text-xs mt-1.5 font-medium truncate" style={{ color: "var(--c-text-muted)" }}>
                Revisá fechas de parciales, entregas y eventos.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewHelp title="Ayuda rápida del calendario" label="Ayuda">
            <p>Agregá fechas importantes como examen, entrega o cuestionario para no perder el ritmo de la cursada.</p>
            <p>Utilizá los colores para identificar eventos y mantené tu calendario organizado.</p>
          </ViewHelp>
          <button type="button" onClick={() => openNewEvent()} aria-label="Crear evento"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: "var(--c-text)", color: "var(--c-bg)", boxShadow: "0 4px 14px rgba(255,255,255,0.1)" }}>
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Slide-up New Event Modal ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowNewModal(false)}>
          <div className="absolute inset-x-0 bottom-0 top-auto rounded-t-[32px] flex flex-col anim-slide-up shadow-[0_-8px_40px_rgba(0,0,0,0.5)] md:rounded-[24px] desktop-dialog"
            style={{ "--dialog-w": "34rem", background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}>
            
            {/* Handle/Drag bar */}
            <div className="w-full flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-12 h-1.5 rounded-full" style={{ background: "var(--c-border-2)" }} />
            </div>

            <div className="px-6 py-2 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
                {editingEventId ? "Editar Evento" : "Nuevo Evento"}
              </h2>
              <button type="button" onClick={() => { playSound("tap"); setShowNewModal(false); }} className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-all" style={{ color: "var(--c-text)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6 pb-12 scroll-panel overflow-y-auto max-h-[80vh]">
              <div>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ej: Entrega de Proyecto..."
                  className="w-full bg-transparent text-3xl font-black placeholder:opacity-30 focus:outline-none transition-all"
                  style={{ color: "var(--c-text)" }} />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Descripción</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3}
                  className="w-full rounded-3xl px-4 py-3 text-sm font-medium bg-[var(--c-glass)] border border-[var(--c-border)] focus:outline-none transition-all"
                  style={{ color: "var(--c-text)" }}
                  placeholder="Detalles del evento..." />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Fecha</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none transition-all [color-scheme:dark]"
                    style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Tipo</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTypeMenuOpen((value) => !value)}
                      className="w-full rounded-2xl px-4 py-3.5 text-left text-sm font-bold flex items-center justify-between transition-all border border-[var(--c-border)] bg-[var(--c-glass)]"
                      style={{ color: "var(--c-text)" }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{eventTypeOptions.find((t) => t.id === newType)?.icon}</span>
                        {eventTypeOptions.find((t) => t.id === newType)?.label}
                      </span>
                      <span className="text-sm" style={{ color: "var(--c-text-muted)" }}>▼</span>
                    </button>

                    {typeMenuOpen && (
                      <div className="absolute inset-x-0 z-20 mt-2 rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg)] shadow-xl overflow-hidden">
                        {eventTypeOptions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setNewType(item.id);
                              setTypeMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-bold transition-all ${newType === item.id ? "bg-white/5 text-[var(--c-text)]" : "text-[var(--c-text-muted)] hover:bg-white/5"}`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span>{item.icon}</span>
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-3" style={{ color: "var(--c-text-muted)" }}>Color de Etiqueta</label>
                <div className="flex gap-4">
                  {colorOptions.map((c) => (
                    <button key={c.id} type="button" onClick={() => { playSound("tap"); setNewColor(c.id); }} title={c.label}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${c.dot} ${
                        newColor === c.id
                          ? "scale-110 shadow-lg ring-4 ring-offset-4 ring-[var(--c-text)] ring-offset-[var(--c-bg)]"
                          : "border-transparent opacity-40 hover:opacity-80"
                      }`}
                      style={newColor === c.id ? { borderColor: "var(--c-text)" } : {}} />
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button type="button" onClick={handleSave}
                  className="w-full rounded-2xl bg-[var(--c-text)] py-4 text-base font-black transition-all shadow-xl active:scale-95"
                  style={{ color: "var(--c-bg)" }}>
                  Guardar Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setDetailEventId(null)}>
          <div className="absolute inset-x-0 bottom-0 top-auto rounded-t-[32px] flex flex-col anim-slide-up shadow-[0_-8px_40px_rgba(0,0,0,0.5)] md:rounded-[24px] desktop-dialog"
            style={{ "--dialog-w": "34rem", background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-12 h-1.5 rounded-full" style={{ background: "var(--c-border-2)" }} />
            </div>

            <div className="px-6 py-2 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>Evento</h2>
                <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>{selectedEvent.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setDetailEventId(null); openEditEvent(selectedEvent); }}
                  className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 bg-[var(--c-glass)] border border-[var(--c-border)] text-sm font-bold transition-all hover:bg-white/[0.05]"
                  style={{ color: "var(--c-text)" }}>
                  <Edit2 size={16} /> Editar
                </button>
                <button type="button" onClick={() => setDetailEventId(null)} className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-all" style={{ color: "var(--c-text)" }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4 pb-12 overflow-y-auto max-h-[80vh]">
              <div className="rounded-[28px] p-4" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                <h3 className="text-lg font-extrabold mb-2" style={{ color: "var(--c-text)" }}>{selectedEvent.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${getStyle(selectedEvent).bg} ${getStyle(selectedEvent).text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStyle(selectedEvent).dot}`} />
                    {selectedEvent.type}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>{fmtShort(new Date(`${selectedEvent.date}T00:00:00`))}</span>
                </div>
                <p className="text-sm leading-6" style={{ color: "var(--c-text)" }}>
                  {selectedEvent.description || "Sin descripción añadida."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Content: Scrollable Grid + Bento Cards ── */}
      <div className="flex-1 overflow-y-auto scroll-panel px-4 sm:px-6 lg:px-8 pb-32 lg:pb-10">
        <div className="desktop-page-shell lg:grid lg:grid-cols-[minmax(0,1.25fr)_360px] lg:gap-6 lg:items-start">
        
        {/* Calendar grid */}
        <div className="mb-8 lg:mb-0 p-5 rounded-[24px]" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--shadow)" }}>
          {/* Month controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <p className="text-xl font-extrabold capitalize" style={{ color: "var(--c-text)" }}>
              {isMobileView && !showMonthCalendar
                ? `${weekDays[0].toLocaleString("es-AR", { day: "numeric", month: "short" })} - ${weekDays[6].toLocaleString("es-AR", { day: "numeric", month: "short" })}`
                : viewDate.toLocaleString("es-AR", { month: "long", year: "numeric" })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {isMobileView && (
                <button type="button" onClick={() => { playSound("tap"); setShowMonthCalendar((value) => !value); }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all hover:bg-white/5 active:scale-95"
                  style={{ color: "var(--c-text)", background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                  {showMonthCalendar ? "Ver semana" : "Ver mes"}
                </button>
              )}
              <div className="flex items-center gap-1 p-1 rounded-[14px]" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                <button type="button" onClick={() => { playSound("tap"); setMonthOffset(monthOffset - 1); }}
                  className="p-2 rounded-xl transition-all hover:bg-white/5 active:scale-90" style={{ color: "var(--c-text-muted)" }}>
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => { playSound("tap"); setMonthOffset(0); }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all hover:bg-white/5 active:scale-95"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}>
                  Hoy
                </button>
                <button type="button" onClick={() => { playSound("tap"); setMonthOffset(monthOffset + 1); }}
                  className="p-2 rounded-xl transition-all hover:bg-white/5 active:scale-90" style={{ color: "var(--c-text-muted)" }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayLabels.map((l) => (
              <div key={l} className="text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>{l}</div>
            ))}
          </div>

          {/* Grid */}
          {isMobileView && !showMonthCalendar ? (
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const key = fmtKey(day);
                const dayEvts = byDate[key] ?? [];
                const isToday = key === todayKey;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => openNewEvent(key)}
                    aria-label={`Agregar evento el ${day.getDate()} de ${day.toLocaleString("es-AR", { month: "long" })}`}
                    title="Agregar evento en esta fecha"
                    className={`aspect-square rounded-2xl flex flex-col justify-center items-center relative transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--c-border-2)] ${
                      isToday
                        ? "bg-[var(--c-text)] text-[var(--c-bg)] shadow-md scale-105 z-10 font-black"
                        : "hover:bg-[var(--c-glass)]"
                    }`}
                    style={!isToday ? { color: "var(--c-text)" } : {}}
                  >
                    <span className={`text-sm sm:text-base ${!isToday ? "font-bold" : ""}`}>
                      {day.getDate()}
                    </span>
                    {dayEvts.length > 0 && (
                      <div className="absolute bottom-1.5 sm:bottom-2 flex gap-1">
                        {dayEvts.slice(0, 3).map((e, i) => {
                          const s = getStyle(e);
                          return (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calDays.map((day, idx) => {
                if (!day) return <div key={`e${idx}`} className="aspect-square" />;
                const key = fmtKey(new Date(year, month, day));
                const dayEvts = byDate[key] ?? [];
                const isToday = key === todayKey;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => openNewEvent(key)}
                    aria-label={`Agregar evento el ${day} de ${viewDate.toLocaleString("es-AR", { month: "long" })}`}
                    title="Agregar evento en esta fecha"
                    className={`aspect-square rounded-2xl flex flex-col justify-center items-center relative transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--c-border-2)] ${
                      isToday
                        ? "bg-[var(--c-text)] text-[var(--c-bg)] shadow-md scale-105 z-10 font-black"
                        : "hover:bg-[var(--c-glass)]"
                    }`}
                    style={!isToday ? { color: "var(--c-text)" } : {}}
                  >
                    <span className={`text-sm sm:text-base ${!isToday ? "font-bold" : ""}`}>
                      {day}
                    </span>
                    {dayEvts.length > 0 && (
                      <div className="absolute bottom-1.5 sm:bottom-2 flex gap-1">
                        {dayEvts.slice(0, 3).map((e, i) => {
                          const s = getStyle(e);
                          return (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bento Cards for Upcoming Events */}
        <div className="mb-6 lg:sticky lg:top-4">
          <h2 className="text-[13px] font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "var(--c-text-muted)" }}>
            <Clock size={16} /> Próximos Eventos
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {upcoming.length === 0 ? (
              <div className="col-span-full py-12 text-center flex flex-col items-center gap-3 rounded-[24px] border border-dashed" style={{ borderColor: "var(--c-border)", background: "var(--c-glass)" }}>
                <CheckCircle2 size={32} className="text-emerald-500/30" />
                <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Estás libre ✨</p>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>No hay eventos próximos en tu calendario.</p>
              </div>
            ) : (
              upcoming.map((e, idx) => {
                const eDate = new Date(`${e.date}T00:00:00`);
                const diff = Math.ceil((eDate.getTime() - today.getTime()) / 86400000);
                const s = getStyle(e);
                const countdownColor = getCountdownColor(diff);
                const isUrgent = diff <= 2;

                return (
                  <div key={e.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openEventDetail(e)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        openEventDetail(e);
                      }
                    }}
                    aria-label={`Ver detalles de ${e.title}`}
                    title="Ver detalles"
                    className="group relative rounded-[20px] p-4 transition-all overflow-hidden anim-slide-up flex items-start justify-between cursor-pointer text-left w-full"
                    style={{ 
                      background: "var(--c-surface)", 
                      border: `1px solid ${isUrgent ? s.hex + "40" : "var(--c-border)"}`,
                      boxShadow: "var(--shadow)",
                      animationDelay: `${idx * 0.05}s`
                    }}>
                    
                    {/* Decorative blur */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-15 pointer-events-none" style={{ background: s.hex }} />

                    <div className="flex flex-col relative z-10 flex-1 pr-3 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {e.type}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-[15px] leading-tight mb-1.5 pr-2 overflow-hidden" style={{
                        color: "var(--c-text)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}>{e.title}</h3>
                      <p className="text-[11px] font-semibold" style={{ color: "var(--c-text-muted)" }}>{fmtShort(eDate)}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center relative z-10 flex-none pl-4 border-l min-w-[84px]" style={{ borderColor: "var(--c-border)" }}>
                      <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-2`} style={{ background: diff === 0 ? s.bg : "transparent" }}>
                        {diff === 0 ? (
                          <span className="text-[13px] font-black leading-none tracking-tight" style={{ color: countdownColor }}>¡HOY!</span>
                        ) : diff === 1 ? (
                          <span className="text-xl font-black leading-none tracking-tight" style={{ color: countdownColor }}>Mñn</span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-4xl font-black leading-none tracking-tighter" style={{ color: countdownColor }}>{diff}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--c-text-muted)" }}>Días</span>
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={(ev) => handleRemove(e.id, ev)}
                        className="mt-2 p-1.5 rounded-lg text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>

      </div>
    </div>
  );
}
