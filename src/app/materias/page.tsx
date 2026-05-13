"use client";

import { useMemo, useState } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { BookOpen, Plus, Trash2, X, Settings2, ChevronDown, ChevronRight, GraduationCap } from "lucide-react";

type UnitStatus = "pendiente" | "en-clase" | "aprendida";
type SubjectType = "cuatrimestral" | "anual";

type Subject = {
  id: string;
  name: string;
  grade: string;
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
  id: "matematica", name: "Matemática", grade: "", conditions: "Parcial 1 y 2 + TP final.",
  color: "violet", type: "cuatrimestral", evaluations: 2,
}];
const initialUnits: Unit[] = [
  { id: "unidad-1", subjectId: "matematica", title: "Funciones y límites", status: "pendiente" },
  { id: "unidad-2", subjectId: "matematica", title: "Derivadas", status: "en-clase" },
];
const createId = () => crypto.randomUUID();

/* ── Modal crear/editar materia ── */
function SubjectModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Subject>;
  onSave: (s: Partial<Subject>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? "violet");
  const [type, setType] = useState<SubjectType>(initial?.type ?? "cuatrimestral");
  const [evaluations, setEvaluations] = useState(initial?.evaluations ?? 2);
  const [grade, setGrade] = useState(initial?.grade ?? "");
  const [conditions, setConditions] = useState(initial?.conditions ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, type, evaluations, grade, conditions });
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
              autoFocus
              className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
            <div className="flex gap-3">
              {SUBJECT_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.dot} transition-all ${
                    color === c.id
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--c-bg-2)] scale-110"
                      : "opacity-40 hover:opacity-80"
                  }`} />
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
                <button type="button" onClick={() => setEvaluations(Math.max(0, evaluations - 1))}
                  className="font-bold text-lg leading-none transition-colors" style={{ color: "var(--c-text-muted)" }}>−</button>
                <span className="flex-1 text-center text-sm font-bold" style={{ color: "var(--c-text)" }}>{evaluations}</span>
                <button type="button" onClick={() => setEvaluations(evaluations + 1)}
                  className="font-bold text-lg leading-none transition-colors" style={{ color: "var(--c-text-muted)" }}>+</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nota actual</label>
              <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Ej: 7"
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Para aprobar</label>
              <input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Ej: 2 parciales"
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
    const s: Subject = { id: createId(), name: data.name!, grade: data.grade ?? "", conditions: data.conditions ?? "", color: data.color, type: data.type, evaluations: data.evaluations };
    setSubjects([...subjects, s]);
    setExpandedId(s.id);
  };

  const handleEditSubject = (data: Partial<Subject>) => {
    if (!editingSubject) return;
    setSubjects(subjects.map((s) => s.id === editingSubject.id ? { ...s, ...data } : s));
    setEditingSubject(null);
  };

  const handleRemoveSubject = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar esta materia y todas sus unidades?")) return;
    setSubjects(subjects.filter((s) => s.id !== id));
    setUnits(units.filter((u) => u.subjectId !== id));
    if (expandedId === id) setExpandedId(subjects.find((s) => s.id !== id)?.id ?? null);
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
      {/* Modal */}
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

      {/* Materias list — expandable cards */}
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

            return (
              <div key={subject.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? c.border : ""}`}
                style={{ background: "var(--c-glass)", borderColor: isExpanded ? undefined : "var(--c-border)" }}>
                {/* Subject header — clickable to expand */}
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
                    {/* Subject meta + actions */}
                    <div className="flex items-center justify-between py-2.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {subject.grade && (
                          <span className={`status-chip ${c.bg} ${c.text} ${c.border}`}>
                            Nota: {subject.grade}
                          </span>
                        )}
                        {subject.evaluations != null && subject.evaluations > 0 && (
                          <span className="status-chip" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
                            {subject.evaluations} eval.
                          </span>
                        )}
                        {subject.conditions && (
                          <span className="text-[11px] hidden sm:inline" style={{ color: "var(--c-text-muted)" }}>{subject.conditions}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setEditingSubject(subject)}
                          className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ color: "var(--c-text-muted)" }}>
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
                          <div key={unit.id} className="flex items-center gap-2.5 group/unit rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.03]">
                            {/* Status chip — tap to cycle */}
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
