"use client";

import { useState } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";

type EventType = "examen" | "entrega" | "cuestionario" | "otro";
type EventColor = "rose" | "pink" | "amber" | "sky" | "emerald";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: EventType;
  color?: EventColor;
};

const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

const colorOptions: {
  id: EventColor;
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}[] = [
  { id: "rose",    label: "Rojo",       dot: "bg-rose-500",    bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/25" },
  { id: "pink",    label: "Rojo claro", dot: "bg-pink-500",    bg: "bg-pink-500/15",    text: "text-pink-400",    border: "border-pink-500/25" },
  { id: "amber",   label: "Amarillo",   dot: "bg-amber-500",   bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/25" },
  { id: "sky",     label: "Celeste",    dot: "bg-sky-500",     bg: "bg-sky-500/15",     text: "text-sky-400",     border: "border-sky-500/25" },
  { id: "emerald", label: "Verde",      dot: "bg-emerald-500", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
];

const initialEvents: CalendarEvent[] = [{
  id: "evento-demo",
  title: "Examen de Matemática",
  date: new Date().toISOString().slice(0, 10),
  type: "examen",
  color: "rose",
}];

const createId = () => crypto.randomUUID();

const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtShort = (d: Date) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(d);

export default function CalendarioPage() {
  const [events, setEvents] = useLocalStorageState<CalendarEvent[]>("mo_events", initialEvents);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState<EventType>("examen");
  const [newColor, setNewColor] = useState<EventColor>("rose");

  const viewDate = new Date();
  viewDate.setMonth(viewDate.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const calDays: Array<number | null> = [];
  for (let i = 0; i < startDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const byDate = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    acc[e.date] = acc[e.date] ? [...acc[e.date], e] : [e];
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = fmtKey(today);

  const upcoming = [...events]
    .filter((e) => new Date(`${e.date}T00:00:00`) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const handleAdd = () => {
    if (!newTitle.trim() || !newDate) return;
    setEvents([...events, { id: createId(), title: newTitle.trim(), date: newDate, type: newType, color: newColor }]);
    setNewTitle("");
    setNewDate("");
    setNewType("examen");
    setNewColor("rose");
    setShowNewModal(false);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar este evento?")) return;
    setEvents(events.filter((e) => e.id !== id));
  };

  const getStyle = (e: CalendarEvent) => {
    if (e.color) {
      const f = colorOptions.find((c) => c.id === e.color);
      if (f) return f;
    }
    const fallbacks: Record<EventType, { bg: string; text: string; border: string; dot: string }> = {
      examen:      { bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/25",    dot: "bg-rose-500" },
      entrega:     { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/25",   dot: "bg-amber-500" },
      cuestionario:{ bg: "bg-sky-500/15",     text: "text-sky-400",     border: "border-sky-500/25",     dot: "bg-sky-500" },
      otro:        { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", dot: "bg-emerald-500" },
    };
    return fallbacks[e.type];
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── New Event Modal ── */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowNewModal(false)} />
          <div className="modal-content anim-slide-up">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
                <CalendarIcon size={16} className="text-rose-400" />
                Nueva fecha
              </p>
              <button type="button" onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Título</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ej: Entrega TP 2"
                  autoFocus
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Fecha</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all [color-scheme:dark]"
                    style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Tipo</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all appearance-none"
                    style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}>
                    <option value="examen">Examen</option>
                    <option value="entrega">Entrega</option>
                    <option value="cuestionario">Cuestionario</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
                <div className="flex gap-3">
                  {colorOptions.map((c) => (
                    <button key={c.id} type="button" onClick={() => setNewColor(c.id)} title={c.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${c.dot} ${
                        newColor === c.id
                          ? "scale-110 shadow-md"
                          : "border-transparent opacity-40 hover:opacity-80"
                      }`}
                      style={newColor === c.id ? { borderColor: "var(--c-text)" } : {}} />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex gap-2">
              <button type="button" onClick={() => setShowNewModal(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
                Cancelar
              </button>
              <button type="button" onClick={handleAdd}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-400 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)] flex items-center justify-center gap-2">
                <Plus size={16} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Layout ── */}
      <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5">
          {/* Month controls */}
          <div className="flex-none flex items-center justify-between mb-4">
            <p className="text-base font-bold capitalize" style={{ color: "var(--c-text)" }}>
              {viewDate.toLocaleString("es-AR", { month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
              <button type="button" onClick={() => setMonthOffset(monthOffset - 1)}
                className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ color: "var(--c-text-muted)" }}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => setMonthOffset(0)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all hover:bg-white/5" style={{ color: "var(--c-text)" }}>
                Hoy
              </button>
              <button type="button" onClick={() => setMonthOffset(monthOffset + 1)}
                className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ color: "var(--c-text-muted)" }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="flex-none grid grid-cols-7 gap-1.5 mb-2">
            {dayLabels.map((l) => (
              <div key={l} className="text-center text-[11px] font-bold uppercase" style={{ color: "var(--c-text-muted)" }}>{l}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="scroll-panel">
            <div className="grid grid-cols-7 gap-1.5">
              {calDays.map((day, idx) => {
                if (!day) return <div key={`e${idx}`} className="aspect-square" />;
                const key = fmtKey(new Date(year, month, day));
                const dayEvts = byDate[key] ?? [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={`aspect-square rounded-xl p-1.5 flex flex-col border transition-all ${
                      isToday
                        ? "bg-rose-500/10 border-rose-500/25"
                        : "border-transparent hover:bg-white/[0.03]"
                    }`}
                    style={!isToday ? { borderColor: "var(--c-border)" } : {}}
                  >
                    <span className={`text-[10px] sm:text-[11px] font-bold leading-none ${isToday ? "text-rose-400" : ""}`}
                      style={!isToday ? { color: "var(--c-text-muted)" } : {}}>
                      {day}
                    </span>
                    <div className="flex gap-[3px] mt-auto flex-wrap">
                      {dayEvts.slice(0, 3).map((e) => {
                        const s = getStyle(e);
                        return (
                          <div
                            key={e.id}
                            className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                            title={e.title}
                          />
                        );
                      })}
                      {dayEvts.length > 3 && (
                        <span className="text-[7px] font-bold" style={{ color: "var(--c-text-muted)" }}>+{dayEvts.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel: upcoming events */}
        <div className="flex-none sm:w-72 overflow-hidden flex flex-col" style={{ borderTop: "1px solid var(--c-border)", borderLeft: "none" }}>
          <div className="flex-none px-4 pt-4 pb-2 flex items-center justify-between sm:border-l sm:border-t-0"
            style={{ borderColor: "var(--c-border)" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
              <Clock size={12} /> Próximos
            </p>
            <button type="button" onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-400 transition-all shadow-[0_0_10px_rgba(244,63,94,0.15)]">
              <Plus size={13} /> Nuevo
            </button>
          </div>

          <div className="scroll-panel px-4 py-2 space-y-2 sm:border-l" style={{ borderColor: "var(--c-border)" }}>
            {upcoming.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <CheckCircle2 size={24} className="text-emerald-500/30" />
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Estás al día ✨</p>
              </div>
            ) : (
              upcoming.map((e) => {
                const eDate = new Date(`${e.date}T00:00:00`);
                const diff = Math.ceil((eDate.getTime() - today.getTime()) / 86400000);
                const s = getStyle(e);

                // Urgency color coding
                const urgency = diff === 0
                  ? { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400", label: "HOY" }
                  : diff === 1
                    ? { bg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-400", label: "MAÑANA" }
                    : diff <= 3
                      ? { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", label: `${diff} días` }
                      : diff <= 7
                        ? { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: `${diff} días` }
                        : { bg: "bg-white/[0.04]", border: "", text: "text-zinc-400", label: `${diff} días` };

                return (
                  <div key={e.id}
                    className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all border ${diff <= 3 ? urgency.border : ""}`}
                    style={{ background: "var(--c-glass)", borderColor: diff > 3 ? "var(--c-border)" : undefined }}>
                    {/* Big countdown */}
                    <div className={`flex-none w-14 h-14 rounded-xl ${urgency.bg} flex flex-col items-center justify-center`}>
                      {diff === 0 ? (
                        <span className={`text-base font-extrabold ${urgency.text}`}>HOY</span>
                      ) : (
                        <>
                          <span className={`text-xl font-extrabold leading-none ${urgency.text}`}>{diff}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${urgency.text} opacity-70`}>
                            {diff === 1 ? "día" : "días"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Event info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{e.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 flex-none rounded-full ${s.dot}`} />
                        <p className="text-[11px] font-medium" style={{ color: "var(--c-text-muted)" }}>
                          {fmtShort(eDate)} · {e.type}
                        </p>
                      </div>
                    </div>

                    {/* Delete */}
                    <button type="button" onClick={() => handleRemove(e.id)}
                      className="flex-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:text-rose-400 hover:bg-rose-500/10"
                      style={{ color: "var(--c-text-muted)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
