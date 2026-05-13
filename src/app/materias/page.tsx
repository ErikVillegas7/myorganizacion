"use client";

import { useMemo, useState } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { BookOpen, Plus, Trash2, X, Settings2, ChevronDown, ChevronRight, GraduationCap, TrendingUp, AlertTriangle } from "lucide-react";

type UnitStatus = "pendiente" | "en-clase" | "aprendida";
type SubjectType = "cuatrimestral" | "anual";

type Subject = {
  id: string;
  name: string;
  grade: string; // legacy — kept for backward compat
  grades?: (number | null)[]; // NEW: array of grades, one per evaluation
  passingGrade?: number; // NEW: nota para aprobar/promocionar (ej: 7)
  conditions: string;
  color?: string;
  type?: SubjectType;
  evaluations?: number;
};

type Unit = { id: string; subjectId: string; title: string; status: UnitStatus };

const SUBJECT_COLORS = [
  { id: "violet", dot: "bg-violet-400", text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { id: "blue",   dot: "bg-blue-400",   text: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  { id: "rose",   dot: "bg-rose-400",   text: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20" },
  { id: "amber",  dot: "bg-amber-400",  text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  { id: "emerald",dot: "bg-emerald-400",text: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
  { id: "pink",   dot: "bg-pink-400",   text: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20" },
];

const getColor = (id?: string) => SUBJECT_COLORS.find((c) => c.id === id) ?? SUBJECT_COLORS[0];

const STATUS_CYCLE: UnitStatus[] = ["pendiente", "en-clase", "aprendida"];
const statusMeta: Record<UnitStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  "pendiente":  { label: "Pendiente", bg: "bg-zinc-500/10",    border: "border-zinc-500/20",    text: "text-zinc-400",    dot: "bg-zinc-400" },
  "en-clase":   { label: "En clase",  bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400" },
  "aprendida":  { label: "Aprendida", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
};

const initialSubjects: Subject[] = [{
  id: "matematica", name: "Matemática", grade: "", conditions: "",
  color: "violet", type: "cuatrimestral", evaluations: 2, passingGrade: 7, grades: [null, null],
}];
const initialUnits: Unit[] = [
  { id: "unidad-1", subjectId: "matematica", title: "Funciones y límites", status: "pendiente" },
  { id: "unidad-2", subjectId: "matematica", title: "Derivadas", status: "en-clase" },
];
const createId = () => crypto.randomUUID();

/** Get label for each evaluation slot */
const evalLabel = (idx: number, total: number) => {
  if (total === 1) return "Nota";
  if (total === 2) return idx === 0 ? "Parcial 1" : "Parcial 2";
  return `Eval ${idx + 1}`;
};

/** Calc average of filled grades */
const calcAvg = (grades?: (number | null)[]): number | null => {
  if (!grades) return null;
  const filled = grades.filter((g): g is number => g !== null && g !== undefined);
  if (filled.length === 0) return null;
  return Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10;
};

/* ── Modal crear/editar materia ── */
function SubjectModal({
  initial, onSave, onClose,
}: {
  initial?: Partial<Subject>;
  onSave: (s: Partial<Subject>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? "violet");
  const [type, setType] = useState<SubjectType>(initial?.type ?? "cuatrimestral");
  const [evaluations, setEvaluations] = useState(initial?.evaluations ?? 2);
  const [passingGrade, setPassing] = useState(initial?.passingGrade ?? 7);
  const [conditions, setConditions] = useState(initial?.conditions ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, type, evaluations, passingGrade, conditions });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content anim-slide-up">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
            <Settings2 size={16} className="text-violet-400" />
            {initial?.id ? "Editar materia" : "Nueva materia"}
          </p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Matemática"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
            <div className="flex gap-3">
              {SUBJECT_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.dot} transition-all ${
                    color === c.id ? "ring-2 ring-offset-2 scale-110" : "opacity-40 hover:opacity-80"
                  }`}
                  style={color === c.id ? { "--tw-ring-color": "var(--c-text)", "--tw-ring-offset-color": "var(--c-bg-2)" } as React.CSSProperties : {}} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Tipo</label>
              <div className="segmented-control">
                <button type="button" data-active={type === "cuatrimestral"} onClick={() => setType("cuatrimestral")}>Cuatri</button>
                <button type="button" data-active={type === "anual"} onClick={() => setType("anual")}>Anual</button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Evaluaciones</label>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
                <button type="button" onClick={() => setEvaluations(Math.max(1, evaluations - 1))}
                  className="font-bold text-lg leading-none transition-colors" style={{ color: "var(--c-text-muted)" }}>−</button>
                <span className="flex-1 text-center text-sm font-bold" style={{ color: "var(--c-text)" }}>{evaluations}</span>
                <button type="button" onClick={() => setEvaluations(Math.min(10, evaluations + 1))}
                  className="font-bold text-lg leading-none transition-colors" style={{ color: "var(--c-text-muted)" }}>+</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nota para aprobar</label>
              <input type="number" min={1} max={10} step={1} value={passingGrade} onChange={(e) => setPassing(Number(e.target.value) || 4)}
                placeholder="Ej: 7"
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Observaciones</label>
              <input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Ej: TP obligatorio"
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave}
            className="flex-1 rounded-xl bg-violet-500 py-2.5 text-sm font-bold text-white hover:bg-violet-400 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            {initial?.id ? "Guardar" : "Crear materia"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MateriasPage() {
  const [subjects, setSubjects] = useLocalStorageState<Subject[]>("mo_subjects", initialSubjects);
  const [units, setUnits] = useLocalStorageState<Unit[]>("mo_units", initialUnits);
  const [expandedId, setExpandedId] = useState<string | null>(subjects[0]?.id ?? null);
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const getProgress = (subjectId: string) => {
    const su = units.filter((u) => u.subjectId === subjectId);
    if (su.length === 0) return 0;
    return Math.round((su.filter((u) => u.status === "aprendida").length / su.length) * 100);
  };

  const handleCreateSubject = (data: Partial<Subject>) => {
    const evalCount = data.evaluations ?? 2;
    const s: Subject = {
      id: createId(), name: data.name!, grade: "", conditions: data.conditions ?? "",
      color: data.color, type: data.type, evaluations: evalCount,
      passingGrade: data.passingGrade ?? 7,
      grades: Array(evalCount).fill(null),
    };
    setSubjects([...subjects, s]);
    setExpandedId(s.id);
  };

  const handleEditSubject = (data: Partial<Subject>) => {
    if (!editingSubject) return;
    const newEvalCount = data.evaluations ?? editingSubject.evaluations ?? 2;
    const oldGrades = editingSubject.grades ?? [];
    // Resize grades array to match new eval count
    const newGrades = Array.from({ length: newEvalCount }, (_, i) => oldGrades[i] ?? null);
    setSubjects(subjects.map((s) => s.id === editingSubject.id ? { ...s, ...data, grades: newGrades } : s));
    setEditingSubject(null);
  };

  const handleRemoveSubject = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar esta materia y todas sus unidades?")) return;
    setSubjects(subjects.filter((s) => s.id !== id));
    setUnits(units.filter((u) => u.subjectId !== id));
    if (expandedId === id) setExpandedId(subjects.find((s) => s.id !== id)?.id ?? null);
  };

  const handleUpdateGrade = (subjectId: string, idx: number, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(subjects.map((s) => {
      if (s.id !== subjectId) return s;
      const grades = [...(s.grades ?? [])];
      grades[idx] = num;
      return { ...s, grades };
    }));
  };

  const handleAddUnit = (subjectId: string) => {
    const t = newUnitTitle.trim();
    if (!t) return;
    setUnits([...units, { id: createId(), subjectId, title: t, status: "pendiente" }]);
    setNewUnitTitle("");
  };

  const handleRemoveUnit = (id: string) => {
    setUnits(units.filter((u) => u.id !== id));
  };

  const cycleStatus = (unitId: string) => {
    setUnits(units.map((u) => {
      if (u.id !== unitId) return u;
      const idx = STATUS_CYCLE.indexOf(u.status);
      return { ...u, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] };
    }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {(showModal || editingSubject) && (
        <SubjectModal
          initial={editingSubject ?? undefined}
          onSave={editingSubject ? handleEditSubject : handleCreateSubject}
          onClose={() => { setShowModal(false); setEditingSubject(null); }}
        />
      )}

      {/* Header */}
      <div className="flex-none px-4 sm:px-6 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <BookOpen size={16} className="text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Materias</p>
            <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>{subjects.length} materias · {units.filter(u => u.status === "aprendida").length}/{units.length} unidades</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-400 transition-all shadow-[0_0_12px_rgba(139,92,246,0.2)]">
          <Plus size={14} /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Materias list */}
      <div className="scroll-panel px-4 sm:px-6 py-4 space-y-3">
        {subjects.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <GraduationCap size={24} className="text-violet-400/50" />
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Sin materias todavía</p>
            <p className="text-xs max-w-[220px]" style={{ color: "var(--c-text-muted)" }}>Creá tu primera materia para organizar las unidades.</p>
          </div>
        ) : (
          subjects.map((subject) => {
            const isExpanded = subject.id === expandedId;
            const pct = getProgress(subject.id);
            const c = getColor(subject.color);
            const subjectUnits = units.filter((u) => u.subjectId === subject.id);
            const evalCount = subject.evaluations ?? 0;
            const grades = subject.grades ?? [];
            const avg = calcAvg(grades);
            const passing = subject.passingGrade ?? 4;
            const isPromoting = avg !== null && avg >= passing;
            const filledCount = grades.filter((g) => g !== null && g !== undefined).length;

            return (
              <div key={subject.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? c.border : ""}`}
                style={{ background: "var(--c-glass)", borderColor: isExpanded ? undefined : "var(--c-border)" }}>
                {/* Subject header */}
                <button type="button"
                  onClick={() => setExpandedId(isExpanded ? null : subject.id)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition-all group">
                  <div className={`w-3 h-3 rounded-full flex-none ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate" style={{ color: "var(--c-text)" }}>{subject.name}</p>
                      {subject.type && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
                          {subject.type === "cuatrimestral" ? "Cuatri" : "Anual"}
                        </span>
                      )}
                      {/* Promotion badge */}
                      {avg !== null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPromoting
                            ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                            : "bg-rose-500/15 border-rose-500/25 text-rose-400"
                        }`}>
                          {isPromoting ? "✓ Promociona" : "✗ No promociona"}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-border)" }}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-400" : c.dot}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold flex-none ${pct === 100 ? "text-emerald-400" : c.text}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={16} style={{ color: "var(--c-text-muted)" }} /> : <ChevronRight size={16} style={{ color: "var(--c-text-muted)" }} />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 anim-fade-in" style={{ borderTop: "1px solid var(--c-border)" }}>
                    {/* Grades section */}
                    {evalCount > 0 && (
                      <div className="py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
                            <TrendingUp size={11} /> Notas ({filledCount}/{evalCount})
                          </p>
                          {avg !== null && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold" style={{ color: "var(--c-text-muted)" }}>
                                Promedio:
                              </span>
                              <span className={`text-sm font-extrabold ${isPromoting ? "text-emerald-400" : "text-rose-400"}`}>
                                {avg}
                              </span>
                              <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                                / necesitás {passing}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(evalCount, 4)}, 1fr)` }}>
                          {Array.from({ length: evalCount }, (_, i) => (
                            <div key={i}>
                              <label className="text-[10px] font-semibold block mb-1" style={{ color: "var(--c-text-muted)" }}>
                                {evalLabel(i, evalCount)}
                              </label>
                              <input
                                type="number" min={1} max={10} step={0.5}
                                value={grades[i] ?? ""}
                                onChange={(e) => handleUpdateGrade(subject.id, i, e.target.value)}
                                placeholder="—"
                                className="w-full rounded-xl px-3 py-2 text-center text-sm font-bold focus:outline-none transition-all"
                                style={{
                                  background: "var(--c-glass)",
                                  border: `1px solid ${grades[i] !== null && grades[i] !== undefined
                                    ? (grades[i]! >= passing ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)")
                                    : "var(--c-border)"}`,
                                  color: grades[i] !== null && grades[i] !== undefined
                                    ? (grades[i]! >= passing ? "#10b981" : "#f43f5e")
                                    : "var(--c-text)",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subject meta + actions */}
                    <div className="flex items-center justify-between py-2.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {subject.conditions && (
                          <span className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>{subject.conditions}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setEditingSubject(subject)}
                          className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
                          <Settings2 size={14} />
                        </button>
                        <button type="button" onClick={() => handleRemoveSubject(subject.id)}
                          className="p-1.5 rounded-lg transition-all hover:bg-rose-500/10 hover:text-rose-400" style={{ color: "var(--c-text-muted)" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Units list */}
                    <div className="space-y-1.5">
                      {subjectUnits.map((unit) => {
                        const sm = statusMeta[unit.status];
                        return (
                          <div key={unit.id} className="flex items-center gap-2.5 group/unit rounded-xl px-3 py-2.5 transition-all">
                            <button type="button" onClick={() => cycleStatus(unit.id)}
                              className={`status-chip flex-none ${sm.bg} ${sm.text} ${sm.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                              {sm.label}
                            </button>
                            <p className="flex-1 text-xs font-semibold truncate" style={{ color: "var(--c-text)" }}>{unit.title}</p>
                            <button type="button" onClick={() => handleRemoveUnit(unit.id)}
                              className="flex-none p-1 rounded opacity-100 sm:opacity-0 sm:group-hover/unit:opacity-100 transition-all hover:text-rose-400"
                              style={{ color: "var(--c-text-muted)" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                      {subjectUnits.length === 0 && (
                        <p className="text-xs text-center py-4" style={{ color: "var(--c-text-muted)" }}>Sin unidades todavía.</p>
                      )}
                    </div>

                    {/* Add unit inline */}
                    <div className="flex gap-2 mt-3">
                      <input value={newUnitTitle} onChange={(e) => setNewUnitTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddUnit(subject.id)}
                        placeholder="Nueva unidad…"
                        className="flex-1 min-w-0 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-all"
                        style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                      <button type="button" onClick={() => handleAddUnit(subject.id)}
                        className="flex-none rounded-xl px-3 py-2 bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 transition-all">
                        <Plus size={14} />
                      </button>
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
