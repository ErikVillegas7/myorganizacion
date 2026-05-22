"use client";

import { useState } from "react";
import { X, Check, Settings2, UserCheck, Link2, BookOpen, GraduationCap, Calendar, Award, ListChecks, FileText, Search } from "lucide-react";
import type { Subject, SubjectType, MateriaKind } from "@/types/materias";
import { SUBJECT_COLORS, ICONS_MAP, ICON_NAMES, MATERIA_KINDS, YEARS } from "@/lib/materias/constants";
import { getColor, getActualCondition } from "@/lib/materias/utils";
import type { SoundType } from "@/lib/use-sound";

const COND_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "Promoción": { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "P" },
  "Regular":   { bg: "bg-blue-500/15",    text: "text-blue-400",    label: "R" },
  "Libre":     { bg: "bg-zinc-500/15",    text: "text-zinc-400",    label: "L" },
  "Abandono":  { bg: "bg-rose-500/15",    text: "text-rose-400",    label: "A" },
};

function SectionCard({ icon: Icon, title, children, className = "" }: { icon: any; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${className}`} style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
        <Icon size={13} strokeWidth={2} />
        {title}
      </p>
      {children}
    </div>
  );
}

export function SubjectModal({ initial, allSubjects, onSave, onClose, playSound }: {
  initial?: Partial<Subject>;
  allSubjects: Subject[];
  onSave: (s: Partial<Subject>) => void;
  onClose: () => void;
  playSound: (s: SoundType) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "BookOpen");
  const [color, setColor] = useState(initial?.color ?? "violet");
  const [type, setType] = useState<SubjectType>(initial?.type ?? "cuatrimestral");
  const [kind, setKind] = useState<MateriaKind>(initial?.kind ?? "teorico-practica");
  const [evaluations, setEvaluations] = useState(initial?.evaluations ?? 2);
  const [regularGrade, setRegularGrade] = useState(initial?.regularGrade ?? 4);
  const [promotionGrade, setPromotionGrade] = useState(initial?.promotionGrade ?? 7);
  const [finalGrade, setFinalGrade] = useState<number | null>(initial?.finalGrade ?? null);
  const [conditions, setConditions] = useState(initial?.conditions ?? "");
  const [manualCondition, setManualCondition] = useState<"Abandono" | undefined>(initial?.manualCondition);
  const [quizRequired, setQuizRequired] = useState(initial?.quizRequired ?? false);
  const [quizRequiredCount, setQuizRequiredCount] = useState(initial?.quizRequiredCount ?? 0);
  const [quizRequiredGrade, setQuizRequiredGrade] = useState(initial?.quizRequiredGrade ?? 6);
  const [groupWorkRequired, setGroupWorkRequired] = useState(initial?.groupWorkRequired ?? false);
  const [groupWorkRequiredCount, setGroupWorkRequiredCount] = useState(initial?.groupWorkRequiredCount ?? 0);
  const [groupWorkRequiredGrade, setGroupWorkRequiredGrade] = useState(initial?.groupWorkRequiredGrade ?? 6);
  const [umbralAsistencia, setUmbralAsistencia] = useState(initial?.umbralAsistencia ?? 75);
  const [correlatividades, setCorrelatividades] = useState<string[]>(initial?.correlatividades ?? []);
  const [regularidadFecha, setRegularidadFecha] = useState(initial?.regularidadFecha ?? "");
  const [year, setYear] = useState<number | undefined>(initial?.year);
  const [corrSearch, setCorrSearch] = useState("");

  const toggleCorr = (id: string) =>
    setCorrelatividades(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleSave = () => {
    if (!name.trim()) return;
    playSound("success");
    onSave({
      name: name.trim(), icon, color, type, kind, evaluations, regularGrade, promotionGrade,
      finalGrade, conditions, manualCondition, quizRequired, quizRequiredCount, quizRequiredGrade,
      groupWorkRequired, groupWorkRequiredCount, groupWorkRequiredGrade,
      umbralAsistencia, correlatividades, regularidadFecha: regularidadFecha || null, year,
    });
    onClose();
  };

  const corrOptions = allSubjects.filter(s => s.id !== initial?.id);
  const selColor = SUBJECT_COLORS.find(c => c.id === color);
  const Ic = ICONS_MAP[icon];

  return (
    <div className="modal-overlay z-50">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content anim-slide-up" style={{ maxWidth: "520px" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${selColor?.hex}20`, border: `1px solid ${selColor?.hex}30` }}>
              <Ic size={15} style={{ color: selColor?.hex }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
                {initial?.id ? "Editar materia" : "Nueva materia"}
              </p>
              {initial?.id && <p className="text-[10px] font-medium" style={{ color: "var(--c-text-muted)" }}>{initial.name}</p>}
            </div>
          </div>
          <button type="button" onClick={() => { playSound("tap"); onClose(); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06]"
            style={{ color: "var(--c-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto scroll-panel">

          {/* Nombre */}
          <div className="relative">
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nombre</label>
            <div className="relative">
              <BookOpen size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" style={{ color: "var(--c-text-muted)" }} />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Arquitectura I"
                className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
          </div>

          {/* Ícono + Color */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Ícono</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scroll-x" style={{ scrollbarWidth: "none" }}>
              {ICON_NAMES.map(ic => {
                const I = ICONS_MAP[ic];
                return (
                  <button key={ic} type="button" onClick={() => { playSound("tap"); setIcon(ic); }}
                    className={`flex-none w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${icon === ic ? "scale-110" : "border-transparent opacity-50 hover:opacity-80"}`}
                    style={icon === ic ? { background: `${selColor?.hex}20`, borderColor: `${selColor?.hex}40`, color: selColor?.hex } : { color: "var(--c-text-muted)" }}>
                    <I size={16} strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map(c => (
                <button key={c.id} type="button" onClick={() => { playSound("tap"); setColor(c.id); }}
                  className={`w-7 h-7 rounded-full transition-all ${color === c.id ? "scale-110 ring-2 ring-offset-2 ring-[var(--c-text)] ring-offset-[var(--c-bg-2)]" : "hover:scale-105"}`}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>

          {/* Modalidad + Duración + Evaluaciones */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Modalidad</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MATERIA_KINDS.map(k => (
                <button key={k.id} type="button" onClick={() => { playSound("tap"); setKind(k.id); }}
                  className={`rounded-xl py-2.5 text-center border transition-all ${kind === k.id ? "bg-violet-500/15 border-violet-500/30 text-violet-400" : "border-[var(--c-border)]"}`}
                  style={kind !== k.id ? { color: "var(--c-text-muted)", background: "var(--c-glass)" } : {}}>
                  <p className="text-xs font-bold">{k.label}</p>
                  {kind === k.id && <p className="text-[8px] mt-0.5 opacity-60 leading-tight px-1">{k.long}</p>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Duración</label>
            <div className="segmented-control">
              <button type="button" data-active={type === "cuatrimestral"} onClick={() => { playSound("tap"); setType("cuatrimestral"); }}>Cuatri</button>
              <button type="button" data-active={type === "anual"} onClick={() => { playSound("tap"); setType("anual"); }}>Anual</button>
            </div>
          </div>

          {/* Evaluaciones + Año */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                <ListChecks size={11} className="inline mr-1" />Evaluaciones
              </label>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                <button type="button" onClick={() => { playSound("tap"); setEvaluations(Math.max(1, evaluations - 1)); }} className="font-bold text-lg px-1 leading-none" style={{ color: "var(--c-text-muted)" }}>−</button>
                <span className="flex-1 text-center text-sm font-bold" style={{ color: "var(--c-text)" }}>{evaluations}</span>
                <button type="button" onClick={() => { playSound("tap"); setEvaluations(Math.min(10, evaluations + 1)); }} className="font-bold text-lg px-1 leading-none" style={{ color: "var(--c-text-muted)" }}>+</button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                <GraduationCap size={11} className="inline mr-1" />Año del plan
              </label>
              <div className="flex gap-1 flex-wrap rounded-xl px-3 py-1.5" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                {YEARS.map(y => (
                  <button key={y.value} type="button" onClick={() => { playSound("tap"); setYear(year === y.value ? undefined : y.value); }}
                    className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${year === y.value ? "bg-violet-500/20 text-violet-400" : "text-zinc-500 hover:text-zinc-300"}`}>
                    {y.value}°
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notas mínimas */}
          <SectionCard icon={Award} title="Notas mínimas">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--c-text-muted)" }}>Regularidad</label>
                <input type="number" min={1} max={10} step={1} value={regularGrade} onChange={e => setRegularGrade(Number(e.target.value) || 4)}
                  className="w-full rounded-xl px-3.5 py-2 text-sm font-medium text-center focus:outline-none transition-all"
                  style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--c-text-muted)" }}>Promoción</label>
                <input type="number" min={1} max={10} step={1} value={promotionGrade} onChange={e => setPromotionGrade(Number(e.target.value) || 7)}
                  className="w-full rounded-xl px-3.5 py-2 text-sm font-medium text-center focus:outline-none transition-all"
                  style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>
            </div>
          </SectionCard>

          {/* Asistencia */}
          <SectionCard icon={UserCheck} title="Asistencia">
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--c-text-muted)" }}>Umbral mínimo</label>
                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
                  <input type="number" min={50} max={100} step={5} value={umbralAsistencia} onChange={e => setUmbralAsistencia(Number(e.target.value) || 75)}
                    className="w-14 text-sm font-bold text-center focus:outline-none" style={{ background: "transparent", color: "var(--c-text)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>%</span>
                </div>
              </div>
              <p className="text-[10px] leading-snug pb-0.5" style={{ color: "var(--c-text-muted)" }}>
                Registrala en Asistencia
              </p>
            </div>
          </SectionCard>

          {/* Regularidad fecha */}
          <div className="relative">
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>
              <Calendar size={11} className="inline mr-1" />Fecha de regularidad
            </label>
            <input type="date" value={regularidadFecha} onChange={e => setRegularidadFecha(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none [color-scheme:dark]"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            <p className="text-[10px] mt-1" style={{ color: "var(--c-text-muted)" }}>Vence a los 3 años. Solo si ya regularizaste.</p>
          </div>

          {/* Correlatividades */}
          {corrOptions.length > 0 && (
            <SectionCard icon={Link2} title="Correlatividades">
              <p className="text-[11px] mb-2" style={{ color: "var(--c-text-muted)" }}>
                Materias necesarias para cursar ésta.
              </p>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" style={{ color: "var(--c-text-muted)" }} />
                <input value={corrSearch} onChange={e => setCorrSearch(e.target.value)} placeholder="Buscar materia..."
                  className="w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none"
                  style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto scroll-panel">
                {corrOptions.filter(s => s.name.toLowerCase().includes(corrSearch.toLowerCase())).map(s => {
                  const c = getColor(s.color);
                  const sel = correlatividades.includes(s.id);
                  const cond = getActualCondition(s);
                  const cs = COND_STYLES[cond.label] ?? COND_STYLES["Libre"];
                  return (
                    <button key={s.id} type="button" onClick={() => { playSound("tap"); toggleCorr(s.id); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${sel ? "border-violet-500/30 bg-violet-500/10" : "border-[var(--c-border)]"}`}
                      style={!sel ? { background: "var(--c-bg-2)" } : {}}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--c-text)" }}>{s.name}</span>
                      {sel && <Check size={14} className="text-violet-400 shrink-0" />}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cs.bg} ${cs.text} shrink-0`}>{cs.label}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Notas adicionales */}
          <SectionCard icon={FileText} title="Condiciones de cursada">
            <div className="space-y-3">
              <input value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Ej: TP obligatorio de taller, visita a obra..."
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />

              {/* Abandono toggle */}
              <label className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer transition-all hover:bg-white/[0.03]"
                style={{ borderColor: manualCondition === "Abandono" ? "var(--c-border-2)" : "var(--c-border)", background: "var(--c-bg-2)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Abandono manual</p>
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Marcá si dejaste la materia.</p>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all ${manualCondition === "Abandono" ? "bg-rose-500" : "bg-zinc-600"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${manualCondition === "Abandono" ? "left-5" : "left-0.5"}`} />
                  <input type="checkbox" checked={manualCondition === "Abandono"} onChange={e => setManualCondition(e.target.checked ? "Abandono" : undefined)} className="sr-only" />
                </div>
              </label>

              {/* Quiz toggle */}
              <div className="rounded-xl border px-3.5 py-2.5 transition-all"
                style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Cuestionario obligatorio</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Examen parcial de múltiple opción</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${quizRequired ? "bg-violet-500" : "bg-zinc-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${quizRequired ? "left-5" : "left-0.5"}`} />
                    <input type="checkbox" checked={quizRequired} onChange={e => { setQuizRequired(e.target.checked); if (!e.target.checked) setQuizRequiredCount(0); }} className="sr-only" />
                  </div>
                </label>
                {quizRequired && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>Cant.</span>
                      <input type="number" min={1} max={20} value={quizRequiredCount === 0 ? "" : quizRequiredCount}
                        onChange={e => setQuizRequiredCount(e.target.value === "" ? 0 : Math.max(1, Number(e.target.value)))}
                        className="w-full text-sm font-bold text-center focus:outline-none" style={{ background: "transparent", color: "var(--c-text)" }} />
                    </div>
                    <div className="rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>Nota</span>
                      <input type="number" min={1} max={10} step={0.5} value={quizRequiredGrade === 0 ? "" : quizRequiredGrade}
                        onChange={e => setQuizRequiredGrade(e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full text-sm font-bold text-center focus:outline-none" style={{ background: "transparent", color: "var(--c-text)" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* TP toggle */}
              <div className="rounded-xl border px-3.5 py-2.5 transition-all"
                style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Trabajo grupal obligatorio</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>TP integrador o proyecto</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${groupWorkRequired ? "bg-violet-500" : "bg-zinc-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${groupWorkRequired ? "left-5" : "left-0.5"}`} />
                    <input type="checkbox" checked={groupWorkRequired} onChange={e => { setGroupWorkRequired(e.target.checked); if (!e.target.checked) setGroupWorkRequiredCount(0); }} className="sr-only" />
                  </div>
                </label>
                {groupWorkRequired && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>Cant.</span>
                      <input type="number" min={0} max={20} value={groupWorkRequiredCount === 0 ? "" : groupWorkRequiredCount}
                        onChange={e => setGroupWorkRequiredCount(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                        className="w-full text-sm font-bold text-center focus:outline-none" style={{ background: "transparent", color: "var(--c-text)" }} />
                    </div>
                    <div className="rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>Nota</span>
                      <input type="number" min={1} max={10} step={0.5} value={groupWorkRequiredGrade === 0 ? "" : groupWorkRequiredGrade}
                        onChange={e => setGroupWorkRequiredGrade(e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full text-sm font-bold text-center focus:outline-none" style={{ background: "transparent", color: "var(--c-text)" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Final */}
          {initial?.id && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                <Award size={11} className="inline mr-1" />Nota de final
              </label>
              <input type="number" min={1} max={10} step={0.5} value={finalGrade ?? ""} onChange={e => setFinalGrade(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Ej: 8" className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
          <button type="button" onClick={() => { playSound("tap"); onClose(); }}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all hover:bg-white/[0.04]"
            style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: selColor?.hex ?? "var(--c-text)", color: "var(--c-bg)" }}>
            <Check size={16} strokeWidth={2.5} /> {initial?.id ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
