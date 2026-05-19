"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSound } from "@/lib/use-sound";
import { useSession } from "next-auth/react";
import { filterActive, mergeById, normalizeItems, nowIso } from "@/lib/sync-utils";
import { ViewHelp } from "@/components/view-help";
import { 
  BookOpen, Plus, Trash2, X, Settings2, GraduationCap, 
  TrendingUp, Check, Book, Atom, Calculator,
  Globe, Languages, Briefcase
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SoundType } from "@/lib/use-sound";

type UnitStatus = "pendiente" | "en-clase" | "aprendida";
type SubjectType = "cuatrimestral" | "anual";

type Subject = {
  id: string;
  name: string;
  icon?: string;
  grade: string; // legacy
  grades?: (number | null)[];
  finalGrade?: number | null;
  regularGrade?: number;
  promotionGrade?: number;
  conditions: string;
  manualCondition?: "Abandono";
  quizRequired?: boolean;
  quizRequiredCount?: number;
  quizRequiredGrade?: number | null;
  quizGrades?: (number | null)[];
  groupWorkRequired?: boolean;
  groupWorkRequiredCount?: number;
  groupWorkRequiredGrade?: number | null;
  groupWorkGrades?: (number | null)[];
  color?: string;
  type?: SubjectType;
  evaluations?: number;
  updatedAt?: string;
  deletedAt?: string | null;
};

type Unit = { id: string; subjectId: string; title: string; status: UnitStatus; updatedAt?: string; deletedAt?: string | null };

const SUBJECT_COLORS = [
  { id: "violet",  dot: "bg-violet-400",  text: "text-violet-400",  bg: "bg-violet-500/15",  border: "border-violet-500/25",  hex: "#a78bfa" },
  { id: "blue",    dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/25",    hex: "#60a5fa" },
  { id: "emerald", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25", hex: "#34d399" },
  { id: "rose",    dot: "bg-rose-400",    text: "text-rose-400",    bg: "bg-rose-500/15",    border: "border-rose-500/25",    hex: "#fb7185" },
  { id: "amber",   dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/25",   hex: "#fbbf24" },
  { id: "zinc",    dot: "bg-zinc-400",    text: "text-zinc-400",    bg: "bg-zinc-500/15",    border: "border-zinc-500/25",    hex: "#a1a1aa" },
  { id: "pink",    dot: "bg-pink-400",    text: "text-pink-400",    bg: "bg-pink-500/15",    border: "border-pink-500/25",    hex: "#f472b6" },
  { id: "sky",     dot: "bg-sky-400",     text: "text-sky-400",     bg: "bg-sky-500/15",     border: "border-sky-500/25",     hex: "#38bdf8" },
  { id: "lime",    dot: "bg-lime-400",    text: "text-lime-400",    bg: "bg-lime-500/15",    border: "border-lime-500/25",    hex: "#84cc16" },
  { id: "teal",    dot: "bg-teal-400",    text: "text-teal-400",    bg: "bg-teal-500/15",    border: "border-teal-500/25",    hex: "#2dd4bf" },
  { id: "indigo",  dot: "bg-indigo-400",  text: "text-indigo-400",  bg: "bg-indigo-500/15",  border: "border-indigo-500/25",  hex: "#818cf8" },
  { id: "fuchsia",dot: "bg-fuchsia-400", text: "text-fuchsia-400", bg: "bg-fuchsia-500/15", border: "border-fuchsia-500/25", hex: "#d946ef" },
];

const ICONS_MAP: Record<string, LucideIcon> = {
  BookOpen, Book, Atom, Calculator, Globe, Languages, Briefcase, GraduationCap
};
const ICON_NAMES = Object.keys(ICONS_MAP);

const getColor = (id?: string) => SUBJECT_COLORS.find((c) => c.id === id) ?? SUBJECT_COLORS[0];

const buildConditionLabel = (subject: Subject) => {
  const pieces: string[] = [];
  if (subject.quizRequired) {
    pieces.push(`Cuestionarios obligatorios ${subject.quizRequiredCount ?? 0}× ≥ ${subject.quizRequiredGrade ?? 1}`);
  }
  if (subject.groupWorkRequired) {
    pieces.push(`Trabajos grupales obligatorios ${subject.groupWorkRequiredCount ?? 0}× ≥ ${subject.groupWorkRequiredGrade ?? 1}`);
  }
  if (subject.conditions) {
    pieces.push(subject.conditions);
  }
  return pieces.join(" · ");
};

const buildConditionList = (subject: Subject) => {
  const items: string[] = [];
  if (subject.quizRequired) {
    items.push(`Cuestionarios obligatorios ${subject.quizRequiredCount ?? 0}× con nota mínima ${subject.quizRequiredGrade ?? 1}`);
  }
  if (subject.groupWorkRequired) {
    items.push(`Trabajos grupales obligatorios ${subject.groupWorkRequiredCount ?? 0}× con nota mínima ${subject.groupWorkRequiredGrade ?? 1}`);
  }
  if (subject.conditions) {
    items.push(subject.conditions);
  }
  return items;
};

const getActualCondition = (subject: Subject) => {
  if (subject.manualCondition === "Abandono") {
    return { label: "Abandono", color: "rose", reason: "Estado marcado manualmente por el usuario." };
  }

  const grades = (subject.grades ?? []).filter((g): g is number => g !== null && g !== undefined);
  const quizCount = subject.quizRequired ? (subject.quizRequiredCount ?? 0) : 0;
  const workCount = subject.groupWorkRequired ? (subject.groupWorkRequiredCount ?? 0) : 0;
  const quizGrades = (subject.quizGrades ?? []).slice(0, quizCount);
  const workGrades = (subject.groupWorkGrades ?? []).slice(0, workCount);

  const regularThreshold = subject.regularGrade ?? 4;
  const promotionThreshold = subject.promotionGrade ?? 6;
  const hasGrades = grades.length > 0;
  const failsEvaluations = grades.some((g) => g < regularThreshold);
  const allPromo = hasGrades && grades.every((g) => g >= promotionThreshold);
  const missingQuiz = quizCount > 0 && quizGrades.some((g) => g === null || g === undefined);
  const missingWork = workCount > 0 && workGrades.some((g) => g === null || g === undefined);
  const failsQuiz = quizCount > 0 && quizGrades.some((g) => g !== null && g !== undefined && g < (subject.quizRequiredGrade ?? 1));
  const failsWork = workCount > 0 && workGrades.some((g) => g !== null && g !== undefined && g < (subject.groupWorkRequiredGrade ?? 1));

  if (failsQuiz || failsWork) return { label: "Regular", color: "amber", reason: "Hay requisitos obligatorios que no cumplen la nota mínima." };
  if (failsEvaluations) return { label: "Abandono", color: "rose", reason: `Alguna evaluación quedó debajo de ${regularThreshold}.` };
  if (allPromo && !missingQuiz && !missingWork) return { label: "Promoción", color: "emerald", reason: `Todas las notas son ${promotionThreshold} o más y los requisitos obligatorios están cumplidos.` };
  if (hasGrades || missingQuiz || missingWork) return { label: "Regular", color: "amber", reason: `Hay notas entre ${regularThreshold} y ${promotionThreshold}, o un requisito obligatorio todavía no está completo.` };
  return { label: "Libre", color: "zinc", reason: "Todavía no hay notas suficientes para definir tu condición." };
};

const conditionPillClasses = (condition: string) => {
  if (condition === "Promoción") return "bg-emerald-500/10 text-emerald-400";
  if (condition === "Regular") return "bg-amber-500/10 text-amber-400";
  if (condition === "Abandono") return "bg-rose-500/10 text-rose-400";
  return "bg-zinc-500/10 text-zinc-400";
};

const STATUS_CYCLE: UnitStatus[] = ["pendiente", "en-clase", "aprendida"];
const statusMeta: Record<UnitStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  "pendiente":  { label: "Pendiente", bg: "bg-zinc-500/10",    border: "border-zinc-500/20",    text: "text-zinc-400",    dot: "bg-zinc-400" },
  "en-clase":   { label: "En clase",  bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400" },
  "aprendida":  { label: "Aprendida", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
};

const initialSubjects: Subject[] = [{
  id: "matematica", name: "Matemática", icon: "Calculator", grade: "", conditions: "",
  quizRequired: true, quizRequiredCount: 1, quizRequiredGrade: 6, quizGrades: [null],
  groupWorkRequired: false, groupWorkRequiredCount: 0, groupWorkRequiredGrade: 6, groupWorkGrades: [],
  color: "violet", type: "cuatrimestral", evaluations: 2, regularGrade: 4, promotionGrade: 7, grades: [null, null],
}];
const initialUnits: Unit[] = [
  { id: "unidad-1", subjectId: "matematica", title: "Funciones y límites", status: "pendiente" },
  { id: "unidad-2", subjectId: "matematica", title: "Derivadas", status: "en-clase" },
];
const createId = () => crypto.randomUUID();

const evalLabel = (idx: number, total: number) => {
  if (total === 1) return "Nota";
  if (total === 2) return idx === 0 ? "Parcial 1" : "Parcial 2";
  return `Eval ${idx + 1}`;
};

const calcAvg = (grades?: (number | null)[]): number | null => {
  if (!grades) return null;
  const filled = grades.filter((g): g is number => g !== null && g !== undefined);
  if (filled.length === 0) return null;
  return Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10;
};

const CircularProgress = ({ pct, colorClass, size = 44, stroke = 4 }: { pct: number, colorClass: string, size?: number, stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const circum = radius * 2 * Math.PI;
  const offset = circum - (pct / 100) * circum;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--c-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" className={`transition-all duration-1000 ease-out ${colorClass}`} stroke="currentColor" strokeWidth={stroke} strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color: "var(--c-text)" }}>{pct}%</span>
    </div>
  );
};

/* ── Modal crear/editar materia ── */
function SubjectModal({
  initial, onSave, onClose, playSound
}: {
  initial?: Partial<Subject>;
  onSave: (s: Partial<Subject>) => void;
  onClose: () => void;
  playSound: (sound: SoundType) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "BookOpen");
  const [color, setColor] = useState(initial?.color ?? "violet");
  const [type, setType] = useState<SubjectType>(initial?.type ?? "cuatrimestral");
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

  const handleSave = () => {
    if (!name.trim()) return;
    playSound("success");
    onSave({
      name: name.trim(),
      icon,
      color,
      type,
      evaluations,
      regularGrade,
      promotionGrade,
      finalGrade,
      conditions,
      manualCondition,
      quizRequired,
      quizRequiredCount,
      quizRequiredGrade,
      groupWorkRequired,
      groupWorkRequiredCount,
      groupWorkRequiredGrade,
    });
    onClose();
  };

  return (
    <div className="modal-overlay z-50">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content anim-slide-up">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
            <Settings2 size={16} className="text-violet-400" />
            {initial?.id ? "Editar materia" : "Nueva materia"}
          </p>
          <button type="button" onClick={() => { playSound("tap"); onClose(); }} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto scroll-panel">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Matemática"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Ícono</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-x">
              {ICON_NAMES.map((ic) => {
                const IconComp = ICONS_MAP[ic];
                return (
                  <button key={ic} type="button" onClick={() => { playSound("tap"); setIcon(ic); }}
                    className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                      icon === ic ? "scale-110 shadow-md text-violet-400" : "border-transparent text-zinc-400 hover:opacity-80"
                    }`}
                    style={icon === ic ? { background: "var(--c-glass)", borderColor: "var(--c-border-2)" } : {}}>
                    <IconComp size={18} strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
            <div className="flex flex-wrap gap-3">
              {SUBJECT_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => { playSound("tap"); setColor(c.id); }}
                  className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm ${
                    color === c.id ? "scale-110 ring-2 ring-offset-2 ring-[var(--c-text)] ring-offset-[var(--c-bg-2)]" : "border-transparent hover:opacity-90"
                  }`}
                  style={{
                    backgroundColor: c.hex,
                    borderColor: color === c.id ? "var(--c-text)" : "transparent",
                    opacity: color === c.id ? 1 : 0.92,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Tipo</label>
              <div className="segmented-control">
                <button type="button" data-active={type === "cuatrimestral"} onClick={() => { playSound("tap"); setType("cuatrimestral"); }}>Cuatri</button>
                <button type="button" data-active={type === "anual"} onClick={() => { playSound("tap"); setType("anual"); }}>Anual</button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Evaluaciones</label>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                <button type="button" onClick={() => { playSound("tap"); setEvaluations(Math.max(1, evaluations - 1)); }}
                  className="font-bold text-lg leading-none transition-colors px-2 active:scale-90" style={{ color: "var(--c-text-muted)" }}>−</button>
                <span className="flex-1 text-center text-sm font-bold" style={{ color: "var(--c-text)" }}>{evaluations}</span>
                <button type="button" onClick={() => { playSound("tap"); setEvaluations(Math.min(10, evaluations + 1)); }}
                  className="font-bold text-lg leading-none transition-colors px-2 active:scale-90" style={{ color: "var(--c-text-muted)" }}>+</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nota mínima para regularizar</label>
              <input type="number" min={1} max={10} step={1} value={regularGrade} onChange={(e) => setRegularGrade(Number(e.target.value) || 4)}
                placeholder="Ej: 4"
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nota mínima para promocionar</label>
              <input type="number" min={1} max={10} step={1} value={promotionGrade} onChange={(e) => setPromotionGrade(Number(e.target.value) || 6)}
                placeholder="Ej: 6"
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
          </div>
          <div className="pt-3">
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nota de Final (opcional)</label>
            <input type="number" min={1} max={10} step={0.5} value={finalGrade ?? ""} onChange={(e) => setFinalGrade(e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Ej: 8"
              className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
          </div>
          <div className="mt-3">
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Condiciones</label>
            <input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Ej: TP obligatorio"
              className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
          </div>

          <div className="rounded-2xl border p-4" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-text-muted)" }}>Condiciones de cursada</p>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-2xl border px-3 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Estado manual</p>
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Marca abuso de abandono cuando quieras registrar la baja.</p>
                </div>
                <input type="checkbox" checked={manualCondition === "Abandono"} onChange={(e) => setManualCondition(e.target.checked ? "Abandono" : undefined)} className="h-4 w-4 rounded border-zinc-500" />
              </label>
              <label className="flex flex-col gap-3 rounded-2xl border px-3 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Cuestionario obligatorio</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Activa si tu materia pide un mínimo en el cuestionario.</p>
                  </div>
                  <input type="checkbox" checked={quizRequired} onChange={(e) => {
                      setQuizRequired(e.target.checked);
                      if (!e.target.checked) setQuizRequiredCount(0);
                    }} className="h-4 w-4 rounded border-zinc-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" disabled={!quizRequired} min={1} max={20} step={1} value={quizRequiredCount === 0 ? "" : quizRequiredCount}
                    onChange={(e) => setQuizRequiredCount(e.target.value === "" ? 0 : Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl px-2 py-2 text-sm text-center" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} placeholder="Cantidad" />
                  <input type="number" disabled={!quizRequired} min={1} max={10} step={0.5} value={quizRequiredGrade === 0 ? "" : quizRequiredGrade} onChange={(e) => setQuizRequiredGrade(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full rounded-xl px-2 py-2 text-sm text-center" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} placeholder="Nota mínima" />
                </div>
              </label>

              <label className="flex flex-col gap-3 rounded-2xl border px-3 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Trabajo grupal obligatorio</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Marca si la materia exige entrega grupal con nota mínima.</p>
                  </div>
                  <input type="checkbox" checked={groupWorkRequired} onChange={(e) => {
                      setGroupWorkRequired(e.target.checked);
                      if (!e.target.checked) setGroupWorkRequiredCount(0);
                    }} className="h-4 w-4 rounded border-zinc-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" disabled={!groupWorkRequired} min={0} max={20} step={1} value={groupWorkRequiredCount === 0 ? "" : groupWorkRequiredCount}
                    onChange={(e) => setGroupWorkRequiredCount(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl px-2 py-2 text-sm text-center" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} placeholder="Cantidad" />
                  <input type="number" disabled={!groupWorkRequired} min={1} max={10} step={0.5} value={groupWorkRequiredGrade === 0 ? "" : groupWorkRequiredGrade} onChange={(e) => setGroupWorkRequiredGrade(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full rounded-xl px-2 py-2 text-sm text-center" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} placeholder="Nota mínima" />
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 flex gap-2" style={{ borderTop: "1px solid var(--c-border)" }}>
          <button type="button" onClick={() => { playSound("tap"); onClose(); }}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave}
            className="flex-1 rounded-xl bg-[var(--c-text)] py-2.5 text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
            style={{ color: "var(--c-bg)" }}>
            <Check size={16} strokeWidth={2.5} /> {initial?.id ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MateriasPage() {
  const [subjects, setSubjects] = useLocalStorageState<Subject[]>("mo_subjects", initialSubjects, {
    normalize: normalizeItems,
  });
  const [units, setUnits] = useLocalStorageState<Unit[]>("mo_units", initialUnits, {
    normalize: normalizeItems,
  });
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef({ subjects, units });
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"condiciones" | "requisitos" | "notas" | "temario">("condiciones");
  const [showQuizRequirements, setShowQuizRequirements] = useState(false);
  const [showWorkRequirements, setShowWorkRequirements] = useState(false);
  const [showModal, setShowModal] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#new",
  );
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newUnitTitle, setNewUnitTitle] = useState("");
  
  const playSound = useSound();

  useEffect(() => {
    localSnapshot.current = { subjects, units };
  }, [subjects, units]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const loadRemote = async () => {
      try {
        const res = await fetch("/api/subjects", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setRemoteReady(true);
          return;
        }
        const data = await res.json();
        const remoteSubjects = normalizeItems(
          (Array.isArray(data?.subjects) ? data.subjects : []) as Subject[],
        );
        const remoteUnits = normalizeItems(
          (Array.isArray(data?.units) ? data.units : []) as Unit[],
        );
        const local = {
          subjects: normalizeItems(localSnapshot.current.subjects),
          units: normalizeItems(localSnapshot.current.units),
        };
        const mergedSubjects = mergeById(local.subjects, remoteSubjects);
        const mergedUnits = mergeById(local.units, remoteUnits);
        const remoteEmpty = remoteSubjects.length === 0 && remoteUnits.length === 0;
        const localHasData = local.subjects.length > 0 || local.units.length > 0;

        if (remoteEmpty && localHasData) {
          await fetch("/api/subjects", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subjects: local.subjects, units: local.units }),
          });
        }

        if (!cancelled) {
          setSubjects(mergedSubjects);
          setUnits(mergedUnits);
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
  }, [status, setSubjects, setUnits]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects, units }),
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [status, remoteReady, subjects, units]);

  useEffect(() => {
    if (window.location.hash === "#new") {
      window.history.replaceState(null, "", "/materias");
    }
  }, []);

  const getProgress = (subjectId: string) => {
    const su = filterActive(units).filter((u) => u.subjectId === subjectId);
    if (su.length === 0) return 0;
    return Math.round((su.filter((u) => u.status === "aprendida").length / su.length) * 100);
  };

  const handleCreateSubject = (data: Partial<Subject>) => {
    const evalCount = data.evaluations ?? 2;
    const quizRequired = data.quizRequired ?? false;
    const quizCount = quizRequired ? (data.quizRequiredCount ?? 0) : 0;
    const workRequired = data.groupWorkRequired ?? false;
    const workCount = workRequired ? (data.groupWorkRequiredCount ?? 0) : 0;
    const now = nowIso();
    const s: Subject = {
      id: createId(),
      name: data.name!,
      icon: data.icon,
      grade: "",
      conditions: data.conditions ?? "",
      manualCondition: data.manualCondition,
      quizRequired,
      quizRequiredCount: quizCount,
      quizRequiredGrade: data.quizRequiredGrade ?? 6,
      quizGrades: Array(quizCount).fill(null),
      groupWorkRequired: workRequired,
      groupWorkRequiredCount: workCount,
      groupWorkRequiredGrade: data.groupWorkRequiredGrade ?? 6,
      groupWorkGrades: Array(workCount).fill(null),
      finalGrade: data.finalGrade ?? null,
      color: data.color,
      type: data.type,
      evaluations: evalCount,
      regularGrade: data.regularGrade ?? 4,
      promotionGrade: data.promotionGrade ?? 7,
      grades: Array(evalCount).fill(null),
      updatedAt: now,
      deletedAt: null,
    };
    setSubjects([...subjects, s]);
  };

  const handleEditSubject = (data: Partial<Subject>) => {
    if (!editingSubject) return;
    const now = nowIso();
    const newEvalCount = data.evaluations ?? editingSubject.evaluations ?? 2;
    const oldGrades = editingSubject.grades ?? [];
    const newGrades = Array.from({ length: newEvalCount }, (_, i) => oldGrades[i] ?? null);

    const quizCount = data.quizRequired ? (data.quizRequiredCount ?? editingSubject.quizRequiredCount ?? 1) : 0;
    const oldQuizGrades = editingSubject.quizGrades ?? [];
    const newQuizGrades = Array.from({ length: quizCount }, (_, i) => oldQuizGrades[i] ?? null);

    const workCount = data.groupWorkRequired ? (data.groupWorkRequiredCount ?? editingSubject.groupWorkRequiredCount ?? 0) : 0;
    const oldWorkGrades = editingSubject.groupWorkGrades ?? [];
    const newWorkGrades = Array.from({ length: workCount }, (_, i) => oldWorkGrades[i] ?? null);

    setSubjects(subjects.map((s) => s.id === editingSubject.id ? {
      ...s,
      ...data,
      grades: newGrades,
      quizGrades: newQuizGrades,
      groupWorkGrades: newWorkGrades,
      finalGrade: data.finalGrade ?? editingSubject.finalGrade ?? null,
      manualCondition: data.manualCondition,
      updatedAt: now,
    } : s));
    setEditingSubject(null);
  };

  const handleUpdateQuizGrade = (subjectId: string, index: number, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(subjects.map((s) => {
      if (s.id !== subjectId) return s;
      const grades = [...(s.quizGrades ?? [])];
      grades[index] = num;
      return { ...s, quizGrades: grades, updatedAt: nowIso() };
    }));
  };

  const handleUpdateGroupWorkGrade = (subjectId: string, index: number, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(subjects.map((s) => {
      if (s.id !== subjectId) return s;
      const grades = [...(s.groupWorkGrades ?? [])];
      grades[index] = num;
      return { ...s, groupWorkGrades: grades, updatedAt: nowIso() };
    }));
  };

  const handleUpdateFinalGrade = (subjectId: string, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(subjects.map((s) => s.id === subjectId ? { ...s, finalGrade: num, updatedAt: nowIso() } : s));
  };

  const handleRemoveSubject = (id: string) => {
    playSound("pop");
    const now = nowIso();
    setSubjects(subjects.map((s) => s.id === id ? { ...s, deletedAt: now, updatedAt: now } : s));
    setUnits(units.map((u) => u.subjectId === id ? { ...u, deletedAt: now, updatedAt: now } : u));
    setSelectedSubjectId(null);
  };

  const handleUpdateGrade = (subjectId: string, idx: number, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(subjects.map((s) => {
      if (s.id !== subjectId) return s;
      const now = nowIso();
      const grades = [...(s.grades ?? [])];
      grades[idx] = num;
      return { ...s, grades, updatedAt: now };
    }));
  };

  const handleAddUnit = (subjectId: string) => {
    const t = newUnitTitle.trim();
    if (!t) return;
    playSound("success");
    const now = nowIso();
    setUnits([...units, { id: createId(), subjectId, title: t, status: "pendiente", updatedAt: now, deletedAt: null }]);
    setNewUnitTitle("");
  };



  const handleRemoveUnit = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar esta unidad?")) return;
    playSound("pop");
    const now = nowIso();
    setUnits(units.map((u) => u.id === id ? { ...u, deletedAt: now, updatedAt: now } : u));
  };

  const cycleStatus = (unitId: string) => {
    playSound("tap");
    const now = nowIso();
    setUnits(units.map((u) => {
      if (u.id !== unitId) return u;
      const idx = STATUS_CYCLE.indexOf(u.status);
      return { ...u, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length], updatedAt: now };
    }));
  };

  const activeSubjects = useMemo(() => filterActive(subjects), [subjects]);
  const activeUnits = useMemo(() => filterActive(units), [units]);
  const selectedSubject = activeSubjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {(showModal || editingSubject) && (
        <SubjectModal
          initial={editingSubject ?? undefined}
          onSave={editingSubject ? handleEditSubject : handleCreateSubject}
          onClose={() => { setShowModal(false); setEditingSubject(null); }}
          playSound={playSound}
        />
      )}

      {/* ── Slide-up Subject Detail Panel ── */}
      {selectedSubject && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedSubjectId(null)}>
          <div className="absolute inset-x-0 bottom-0 top-[10%] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.4)] flex flex-col anim-slide-up desktop-dialog"
            style={{ "--dialog-w": "48rem", "--dialog-h": "84vh", background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}>
            
            {/* Header del modal */}
            <div className="flex-none px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)", borderRadius: "1.5rem 1.5rem 0 0" }}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColor(selectedSubject.color).bg} ${getColor(selectedSubject.color).text}`}>
                  {(() => {
                    const Ic = selectedSubject.icon ? ICONS_MAP[selectedSubject.icon] : BookOpen;
                    return <Ic size={20} strokeWidth={2} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--c-text)" }}>{selectedSubject.name}</h2>
                  <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>
                    {selectedSubject.type === "anual" ? "Materia Anual" : "Materia Cuatrimestral"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { playSound("tap"); setEditingSubject(selectedSubject); }} className="p-2 rounded-full hover:bg-white/[0.05] transition-all" style={{ color: "var(--c-text-muted)" }}>
                  <Settings2 size={18} />
                </button>
                <button onClick={() => { playSound("tap"); setSelectedSubjectId(null); }} className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-all ml-1" style={{ color: "var(--c-text)" }}>
                  <X size={18} />
                </button>
              </div>
            </div>
            {(() => {
              const condition = getActualCondition(selectedSubject);
              return (
                <div className="flex justify-start pl-5 pt-3 pb-4">
                  <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold ${conditionPillClasses(condition.label)}`}>
                    <span>{condition.label}</span>
                  </div>
                </div>
              );
            })()}

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto scroll-panel p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                {(["condiciones", "requisitos", "notas", "temario"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDetailTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${detailTab === tab ? "bg-[var(--c-text)] text-[var(--c-bg)]" : "bg-[var(--c-bg-2)] text-[var(--c-text)]"}`}
                  >
                    {tab === "condiciones" ? "Condiciones" : tab === "requisitos" ? "Requisitos" : tab === "notas" ? "Notas" : "Temario"}
                  </button>
                ))}
              </div>
              <div className="space-y-6">
                {detailTab === "condiciones" ? (
                  <>
                    {/* Condiciones de cursada */}
              <div className="rounded-[24px] border p-4" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-text-muted)" }}>Condiciones de cursada</h3>
                {buildConditionList(selectedSubject).length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No hay condiciones adicionales registradas.</p>
                ) : (
                  <ul className="space-y-2 text-sm" style={{ color: "var(--c-text)" }}>
                    {buildConditionList(selectedSubject).map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-rose-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
                  </>
                ) : null}
                {detailTab === "requisitos" ? (
                  <>
                    <div className="space-y-4">
                      {selectedSubject.quizRequired && (selectedSubject.quizRequiredCount ?? 0) > 0 ? (
                        <div className="rounded-[24px] border p-4" style={{ background: (selectedSubject.quizGrades ?? []).filter((g) => g !== null && g !== undefined).length === (selectedSubject.quizRequiredCount ?? 0) ? "rgba(16,185,129,0.08)" : "var(--c-bg-2)", borderColor: (selectedSubject.quizGrades ?? []).filter((g) => g !== null && g !== undefined).length === (selectedSubject.quizRequiredCount ?? 0) ? "rgba(16,185,129,0.25)" : "var(--c-border)" }}>
                          <button type="button" onClick={() => setShowQuizRequirements((prev) => !prev)}
                            className="w-full flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left"
                            style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Cuestionarios</p>
                              <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
                                {selectedSubject.quizRequiredCount} × mínimo {selectedSubject.quizRequiredGrade ?? 1}
                              </p>
                            </div>
                            <span className="text-xs font-bold" style={{ color: "var(--c-text-muted)" }}>{showQuizRequirements ? "Ocultar" : "Mostrar"}</span>
                          </button>
                          <div className="mt-3 flex items-center justify-between text-xs font-semibold" style={{ color: (selectedSubject.quizGrades ?? []).filter((g) => g !== null && g !== undefined).length === (selectedSubject.quizRequiredCount ?? 0) ? "#047857" : "var(--c-text-muted)" }}>
                            <span>{(selectedSubject.quizGrades ?? []).filter((g) => g !== null && g !== undefined).length}/{selectedSubject.quizRequiredCount} completados</span>
                            <span>{selectedSubject.quizRequiredCount ? Math.round(((selectedSubject.quizGrades ?? []).filter((g) => g !== null && g !== undefined).length / selectedSubject.quizRequiredCount) * 100) : 0}%</span>
                          </div>
                          {showQuizRequirements ? (
                            <>
                              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {Array.from({ length: selectedSubject.quizRequiredCount ?? 0 }, (_, idx) => (
                                  <label key={idx} className="rounded-2xl border px-3 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--c-text-muted)" }}>Cuestionario {idx + 1}</p>
                                    <input type="number" min={1} max={10} step={0.5} value={(selectedSubject.quizGrades ?? [])[idx] ?? ""}
                                      onChange={(e) => handleUpdateQuizGrade(selectedSubject.id, idx, e.target.value)}
                                      placeholder="Ej: 7"
                                      className="w-full rounded-xl px-3 py-2 text-sm font-medium focus:outline-none transition-all"
                                      style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                                  </label>
                                ))}
                              </div>
                              {(() => {
                                const grades = selectedSubject.quizGrades ?? [];
                                const allFilled = grades.length === (selectedSubject.quizRequiredCount ?? 0) && grades.every((g) => g !== null && g !== undefined);
                                const allPassed = allFilled && grades.every((g) => (g ?? 0) >= (selectedSubject.quizRequiredGrade ?? 0));
                                if (allPassed) {
                                  return (
                                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                                      Todos los cuestionarios están aprobados. ¡Felicitaciones! 🎉
                                    </div>
                                  );
                                }
                                if (allFilled) {
                                  return (
                                    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                                      Todos los cuestionarios están cargados, pero alguno no alcanzó la nota mínima.
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          ) : null}
                        </div>
                      ) : null}

                      {selectedSubject.groupWorkRequired && (selectedSubject.groupWorkRequiredCount ?? 0) > 0 ? (
                        <div className="rounded-[24px] border p-4" style={{ background: ((selectedSubject.groupWorkGrades ?? []).filter((g) => g !== null && g !== undefined).length === (selectedSubject.groupWorkRequiredCount ?? 0)) ? "rgba(16,185,129,0.08)" : "var(--c-bg-2)", borderColor: ((selectedSubject.groupWorkGrades ?? []).filter((g) => g !== null && g !== undefined).length === (selectedSubject.groupWorkRequiredCount ?? 0)) ? "rgba(16,185,129,0.25)" : "var(--c-border)" }}>
                          <button type="button" onClick={() => setShowWorkRequirements((prev) => !prev)}
                            className="w-full flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left"
                            style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Trabajos grupales</p>
                              <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
                                {selectedSubject.groupWorkRequiredCount} × mínimo {selectedSubject.groupWorkRequiredGrade ?? 1}
                              </p>
                            </div>
                            <span className="text-xs font-bold" style={{ color: "var(--c-text-muted)" }}>{showWorkRequirements ? "Ocultar" : "Mostrar"}</span>
                          </button>
                          <div className="mt-3 flex items-center justify-between text-xs font-semibold" style={{ color: ((selectedSubject.groupWorkGrades ?? []).filter((g) => g !== null && g !== undefined).length === (selectedSubject.groupWorkRequiredCount ?? 0)) ? "#047857" : "var(--c-text-muted)" }}>
                            <span>{(selectedSubject.groupWorkGrades ?? []).filter((g) => g !== null && g !== undefined).length}/{selectedSubject.groupWorkRequiredCount} completados</span>
                            <span>{selectedSubject.groupWorkRequiredCount ? Math.round(((selectedSubject.groupWorkGrades ?? []).filter((g) => g !== null && g !== undefined).length / selectedSubject.groupWorkRequiredCount) * 100) : 0}%</span>
                          </div>
                          {showWorkRequirements ? (
                            <>
                              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {Array.from({ length: selectedSubject.groupWorkRequiredCount ?? 0 }, (_, idx) => (
                                  <label key={idx} className="rounded-2xl border px-3 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--c-text-muted)" }}>Trabajo {idx + 1}</p>
                                    <input type="number" min={1} max={10} step={0.5} value={(selectedSubject.groupWorkGrades ?? [])[idx] ?? ""}
                                      onChange={(e) => handleUpdateGroupWorkGrade(selectedSubject.id, idx, e.target.value)}
                                      placeholder="Ej: 8"
                                      className="w-full rounded-xl px-3 py-2 text-sm font-medium focus:outline-none transition-all"
                                      style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                                  </label>
                                ))}
                              </div>
                              {(() => {
                                const grades = selectedSubject.groupWorkGrades ?? [];
                                const allFilled = grades.length === (selectedSubject.groupWorkRequiredCount ?? 0) && grades.every((g) => g !== null && g !== undefined);
                                const allPassed = allFilled && grades.every((g) => (g ?? 0) >= (selectedSubject.groupWorkRequiredGrade ?? 0));
                                if (allPassed) {
                                  return (
                                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                                      Todos los trabajos grupales están aprobados. ¡Bien hecho! 🎉
                                    </div>
                                  );
                                }
                                if (allFilled) {
                                  return (
                                    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                                      Todos los trabajos grupales están cargados, pero alguno no alcanzó la nota mínima.
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {detailTab === "notas" ? (
                  <>
                    {/* Notas y Promedio */}
                    {selectedSubject.evaluations ? (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
                          <TrendingUp size={14} /> Notas y Promedio
                        </h3>
                        <div className="p-4 rounded-[20px] flex flex-col md:flex-row gap-5" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                          {/* Grid de notas */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Array.from({ length: selectedSubject.evaluations }, (_, i) => {
                              const val = (selectedSubject.grades ?? [])[i];
                              const isPromo = val !== null && val >= (selectedSubject.promotionGrade ?? 6);
                              const isRegular = val !== null && val >= (selectedSubject.regularGrade ?? 4);
                              return (
                                <div key={i}>
                                  <label className="text-[10px] font-semibold block mb-1 text-center" style={{ color: "var(--c-text-muted)" }}>
                                    {evalLabel(i, selectedSubject.evaluations!)}
                                  </label>
                                  <input
                                    type="number" min={1} max={10} step={0.5}
                                    value={val ?? ""}
                                    onChange={(e) => handleUpdateGrade(selectedSubject.id, i, e.target.value)}
                                    placeholder="—"
                                    className="w-full rounded-xl px-3 py-2 text-center text-base font-bold focus:outline-none transition-all"
                                    style={{
                                      background: "var(--c-bg-2)",
                                      border: `1px solid ${val !== null && val !== undefined ? (isPromo ? "rgba(16,185,129,0.3)" : isRegular ? "rgba(234,179,8,0.3)" : "rgba(244,63,94,0.3)") : "var(--c-border)"}`,
                                      color: val !== null && val !== undefined ? (isPromo ? "#10b981" : isRegular ? "#ca8a04" : "#f43f5e") : "var(--c-text)",
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          {/* Promedio */}
                          {(() => {
                            const avg = calcAvg(selectedSubject.grades);
                            const regular = selectedSubject.regularGrade ?? 4;
                            const promotion = selectedSubject.promotionGrade ?? 6;
                            const isPromoting = avg !== null && avg >= promotion;
                            const isRegular = avg !== null && avg >= regular;
                            return avg !== null ? (
                              <div className="flex-none flex flex-col items-center justify-center pl-0 md:pl-5 md:border-l" style={{ borderColor: "var(--c-border)" }}>
                                <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-muted)" }}>Promedio</span>
                                <span className={`text-3xl font-black ${isPromoting ? "text-emerald-400" : isRegular ? "text-amber-400" : "text-rose-400"}`}>{avg}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${isPromoting ? "bg-emerald-500/10 text-emerald-400" : isRegular ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"}`}>
                                  {isPromoting ? "✓ Promociona" : isRegular ? "Regular" : "✗ No Promo"}
                                </span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                        {(() => {
                          const condition = getActualCondition(selectedSubject);
                          if (condition.label === "Regular") {
                            return (
                              <>
                                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700">
                                  Esta materia está en Regular: deberás rendir Final.
                                </div>
                                <div className="mt-4 rounded-[20px] border p-4" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
                                  <p className="text-sm font-semibold mb-2" style={{ color: "var(--c-text)" }}>Final</p>
                                  <input type="number" min={1} max={10} step={0.5} value={selectedSubject.finalGrade ?? ""}
                                    onChange={(e) => handleUpdateFinalGrade(selectedSubject.id, e.target.value)}
                                    placeholder="Ej: 8"
                                    className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                                    style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                                  {selectedSubject.finalGrade !== null && selectedSubject.finalGrade !== undefined ? (
                                    <p className="mt-3 text-xs" style={{ color: selectedSubject.finalGrade >= (selectedSubject.promotionGrade ?? 6) ? "#16a34a" : "#b45309" }}>
                                      {selectedSubject.finalGrade >= (selectedSubject.promotionGrade ?? 6) ? "Final aprobado" : "Final cargado, todavía no alcanza la promoción."}
                                    </p>
                                  ) : null}
                                </div>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {detailTab === "temario" ? (
                  <>
                    {/* Unidades (Kanban/Lista) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
                  <BookOpen size={14} /> Temario / Unidades
                </h3>
                
                {/* Agregar unidad */}
                <div className="flex gap-2 mb-4">
                  <input value={newUnitTitle} onChange={(e) => setNewUnitTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUnit(selectedSubject.id)}
                    placeholder="Escribí una nueva unidad y dale a +"
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-all"
                    style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                  <button type="button" onClick={() => handleAddUnit(selectedSubject.id)}
                    className="flex-none w-11 h-11 rounded-xl bg-[var(--c-text)] text-[var(--c-bg)] flex items-center justify-center transition-all active:scale-95 shadow-md">
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Lista interactiva */}
                <div className="space-y-2">
                  {activeUnits.filter((u) => u.subjectId === selectedSubject.id).length === 0 ? (
                    <p className="text-xs text-center py-6 border rounded-xl border-dashed" style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)" }}>Sin unidades. Agrega los temas de la materia arriba.</p>
                  ) : (
                    activeUnits.filter((u) => u.subjectId === selectedSubject.id).map((unit) => {
                      const sm = statusMeta[unit.status];
                      return (
                        <div key={unit.id} className="flex items-center justify-between p-3 rounded-[16px] border transition-all hover:scale-[1.01]"
                          style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
                          <button type="button" onClick={() => cycleStatus(unit.id)}
                            className="flex-1 flex items-center gap-3 text-left">
                            <span className={`status-chip flex-none ${sm.bg} ${sm.text} ${sm.border} text-[10px] px-2.5 py-1`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                              {sm.label}
                            </span>
                            <span className={`text-sm font-bold flex-1 truncate transition-all ${unit.status === "aprendida" ? "line-through opacity-50" : ""}`} style={{ color: "var(--c-text)" }}>
                              {unit.title}
                            </span>
                          </button>
                          <button type="button" onClick={() => { if(window.confirm("¿Eliminar unidad?")) handleRemoveUnit(unit.id); }}
                            className="p-2 rounded-lg text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all ml-2">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Boton Danger */}
              <div className="pt-6">
                <button type="button" onClick={() => {
                  if(window.confirm("¿Seguro que querés eliminar toda la materia y sus datos?")) {
                    handleRemoveSubject(selectedSubject.id);
                  }
                }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-all text-xs font-bold">
                  <Trash2 size={14} /> Eliminar Materia Completa
                </button>
              </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header Principal ── */}
      <div className="flex-none px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between z-10 desktop-page-shell" style={{ background: "var(--c-bg)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight leading-none truncate" style={{ color: "var(--c-text)" }}>Materias</h1>
            <p className="text-xs mt-1.5 font-medium truncate" style={{ color: "var(--c-text-muted)" }}>
              {activeUnits.filter(u => u.status === "aprendida").length} de {activeUnits.length} temas aprendidos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewHelp title="Ayuda rápida de materias" label="Ayuda">
            <p>Creá una materia y registrá sus condiciones de cursada como cuestionarios obligatorios, trabajos grupales y nota de aprobación.</p>
            <p>Utilizá el promedio y las unidades para evaluar tu progreso en cada materia.</p>
          </ViewHelp>
          <button type="button" onClick={() => { playSound("click"); setShowModal(true); }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: "var(--c-text)", color: "var(--c-bg)", boxShadow: "0 4px 14px rgba(255,255,255,0.1)" }}>
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Cuadrícula de Tarjetas Widget ── */}
      <div className="scroll-panel px-4 sm:px-6 lg:px-8 py-2 pb-24 lg:pb-10">
        <div className="desktop-page-shell">
        {activeSubjects.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[var(--c-glass)] border flex items-center justify-center" style={{ borderColor: "var(--c-border)" }}>
              <GraduationCap size={28} className="opacity-40" />
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--c-text)" }}>Ninguna materia todavía</p>
              <p className="text-xs mt-1 max-w-[220px] mx-auto" style={{ color: "var(--c-text-muted)" }}>Creá tu primera materia para empezar a estudiar ordenadamente.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSubjects.map((subject, index) => {
              const c = getColor(subject.color);
              const pct = getProgress(subject.id);
              const avg = calcAvg(subject.grades);
              const promotion = subject.promotionGrade ?? 6;
              const subjectCondition = getActualCondition(subject);
              const finalApproved = subject.finalGrade !== null && subject.finalGrade !== undefined && subject.finalGrade >= promotion;
              const canShowAvg = subjectCondition.label === "Promoción" || finalApproved;
              const avgLabel = subjectCondition.label === "Promoción" ? "Promociona" : finalApproved ? "Final aprobado" : null;
              const avgColorClass = subjectCondition.label === "Promoción" || finalApproved ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400";
              const IconComp = subject.icon ? ICONS_MAP[subject.icon] : BookOpen;

              return (
                <button key={subject.id} type="button"
                  onClick={() => { playSound("tap"); setDetailTab("condiciones"); setShowQuizRequirements(false); setShowWorkRequirements(false); setSelectedSubjectId(subject.id); }}
                  className="relative p-5 rounded-[24px] transition-all hover:scale-[1.02] active:scale-95 text-left flex flex-col justify-between overflow-hidden anim-slide-up"
                  style={{ 
                    background: "var(--c-surface)", 
                    border: "1px solid var(--c-border)",
                    boxShadow: "var(--shadow)",
                    minHeight: "160px",
                    animationDelay: `${index * 0.05}s`
                  }}>
                  
                  {/* Decorative blur in background */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none" style={{ background: c.hex }} />

                  <div className="flex items-start justify-between relative z-10 w-full">
                    <div className="flex-1 pr-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${c.bg} ${c.text} shadow-sm`}>
                        <IconComp size={20} strokeWidth={2} />
                      </div>
                      <h3 className="font-bold text-lg leading-tight truncate" style={{ color: "var(--c-text)" }}>{subject.name}</h3>
                      {buildConditionLabel(subject) && (
                        <p className="text-[10px] font-semibold mt-1 whitespace-normal break-words" style={{ color: "var(--c-text-muted)" }}>
                          ⚠️ {buildConditionLabel(subject)}
                        </p>
                      )}
                    <span className={`inline-flex items-center gap-1 mt-3 rounded-full px-2 py-1 text-[10px] font-bold ${conditionPillClasses(subjectCondition.label)}`}>
                      {subjectCondition.label}
                    </span>
                    </div>
                    {/* Anillo de Progreso */}
                    <div className="flex-none">
                      <CircularProgress pct={pct} colorClass={c.text} size={50} stroke={4.5} />
                    </div>
                  </div>

                  <div className="relative z-10 flex items-end justify-between w-full mt-4 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-muted)" }}>Promedio</p>
                      {canShowAvg && avg !== null ? (
                        <p className={`text-xl font-black text-emerald-400`}>{avg}</p>
                      ) : (
                        <p className="text-xl font-black opacity-30" style={{ color: "var(--c-text-muted)" }}>-</p>
                      )}
                    </div>
                    {avgLabel ? (
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${avgColorClass}`}>
                        {avgLabel}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
