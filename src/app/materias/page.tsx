"use client";

import { useMemo, useState, useEffect } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSound } from "@/lib/use-sound";
import { 
  BookOpen, Plus, Trash2, X, Settings2, GraduationCap, 
  TrendingUp, Check, AlertTriangle, Book, Atom, Calculator, 
  Globe, Languages, Briefcase
} from "lucide-react";

type UnitStatus = "pendiente" | "en-clase" | "aprendida";
type SubjectType = "cuatrimestral" | "anual";

type Subject = {
  id: string;
  name: string;
  icon?: string;
  grade: string; // legacy
  grades?: (number | null)[]; 
  passingGrade?: number; 
  conditions: string;
  color?: string;
  type?: SubjectType;
  evaluations?: number;
};

type Unit = { id: string; subjectId: string; title: string; status: UnitStatus };

const SUBJECT_COLORS = [
  { id: "violet", dot: "bg-violet-400", text: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/25", hex: "#a78bfa" },
  { id: "blue",   dot: "bg-blue-400",   text: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/25",   hex: "#60a5fa" },
  { id: "emerald",dot: "bg-emerald-400",text: "text-emerald-400",bg: "bg-emerald-500/15",border: "border-emerald-500/25", hex: "#34d399" },
  { id: "rose",   dot: "bg-rose-400",   text: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/25",   hex: "#fb7185" },
  { id: "amber",  dot: "bg-amber-400",  text: "text-amber-400",  bg: "bg-amber-500/15",  border: "border-amber-500/25",  hex: "#fbbf24" },
  { id: "zinc",   dot: "bg-zinc-400",   text: "text-zinc-400",   bg: "bg-zinc-500/15",   border: "border-zinc-500/25",   hex: "#a1a1aa" },
];

const ICONS_MAP: Record<string, any> = {
  BookOpen, Book, Atom, Calculator, Globe, Languages, Briefcase, GraduationCap
};
const ICON_NAMES = Object.keys(ICONS_MAP);

const getColor = (id?: string) => SUBJECT_COLORS.find((c) => c.id === id) ?? SUBJECT_COLORS[0];

const STATUS_CYCLE: UnitStatus[] = ["pendiente", "en-clase", "aprendida"];
const statusMeta: Record<UnitStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  "pendiente":  { label: "Pendiente", bg: "bg-zinc-500/10",    border: "border-zinc-500/20",    text: "text-zinc-400",    dot: "bg-zinc-400" },
  "en-clase":   { label: "En clase",  bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400" },
  "aprendida":  { label: "Aprendida", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
};

const initialSubjects: Subject[] = [{
  id: "matematica", name: "Matemática", icon: "Calculator", grade: "", conditions: "",
  color: "violet", type: "cuatrimestral", evaluations: 2, passingGrade: 7, grades: [null, null],
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
  playSound: (sound: any) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "BookOpen");
  const [color, setColor] = useState(initial?.color ?? "violet");
  const [type, setType] = useState<SubjectType>(initial?.type ?? "cuatrimestral");
  const [evaluations, setEvaluations] = useState(initial?.evaluations ?? 2);
  const [passingGrade, setPassing] = useState(initial?.passingGrade ?? 7);
  const [conditions, setConditions] = useState(initial?.conditions ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    playSound("success");
    onSave({ name: name.trim(), icon, color, type, evaluations, passingGrade, conditions });
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
            <div className="flex gap-3">
              {SUBJECT_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => { playSound("tap"); setColor(c.id); }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${c.bg} ${
                    color === c.id ? "scale-110 shadow-md ring-2 ring-offset-2 ring-[var(--c-text)] ring-offset-[var(--c-bg-2)]" : "border-transparent opacity-40 hover:opacity-80"
                  }`}
                  style={color === c.id ? { borderColor: "var(--c-text)" } : {}} />
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
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nota para aprobar</label>
              <input type="number" min={1} max={10} step={1} value={passingGrade} onChange={(e) => setPassing(Number(e.target.value) || 4)}
                placeholder="Ej: 7"
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Condiciones</label>
              <input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Ej: TP obligatorio"
                className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none transition-all"
                style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
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
  const [subjects, setSubjects] = useLocalStorageState<Subject[]>("mo_subjects", initialSubjects);
  const [units, setUnits] = useLocalStorageState<Unit[]>("mo_units", initialUnits);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newUnitTitle, setNewUnitTitle] = useState("");
  
  const playSound = useSound();

  useEffect(() => {
    if (window.location.hash === "#new") {
      setShowModal(true);
      window.history.replaceState(null, "", "/materias");
    }
  }, []);

  const getProgress = (subjectId: string) => {
    const su = units.filter((u) => u.subjectId === subjectId);
    if (su.length === 0) return 0;
    return Math.round((su.filter((u) => u.status === "aprendida").length / su.length) * 100);
  };

  const handleCreateSubject = (data: Partial<Subject>) => {
    const evalCount = data.evaluations ?? 2;
    const s: Subject = {
      id: createId(), name: data.name!, icon: data.icon, grade: "", conditions: data.conditions ?? "",
      color: data.color, type: data.type, evaluations: evalCount,
      passingGrade: data.passingGrade ?? 7,
      grades: Array(evalCount).fill(null),
    };
    setSubjects([...subjects, s]);
  };

  const handleEditSubject = (data: Partial<Subject>) => {
    if (!editingSubject) return;
    const newEvalCount = data.evaluations ?? editingSubject.evaluations ?? 2;
    const oldGrades = editingSubject.grades ?? [];
    const newGrades = Array.from({ length: newEvalCount }, (_, i) => oldGrades[i] ?? null);
    setSubjects(subjects.map((s) => s.id === editingSubject.id ? { ...s, ...data, grades: newGrades } : s));
    setEditingSubject(null);
  };

  const handleRemoveSubject = (id: string) => {
    playSound("pop");
    setSubjects(subjects.filter((s) => s.id !== id));
    setUnits(units.filter((u) => u.subjectId !== id));
    setSelectedSubjectId(null);
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
    playSound("success");
    setUnits([...units, { id: createId(), subjectId, title: t, status: "pendiente" }]);
    setNewUnitTitle("");
  };



  const handleRemoveUnit = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar esta unidad?")) return;
    playSound("pop");
    setUnits(units.filter((u) => u.id !== id));
  };

  const cycleStatus = (unitId: string) => {
    playSound("tap");
    setUnits(units.map((u) => {
      if (u.id !== unitId) return u;
      const idx = STATUS_CYCLE.indexOf(u.status);
      return { ...u, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] };
    }));
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

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
          <div className="absolute inset-x-0 bottom-0 top-[10%] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.4)] flex flex-col anim-slide-up"
            style={{ background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" }}
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

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto scroll-panel p-5 space-y-6">
              
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
                        const isPass = val !== null && val >= (selectedSubject.passingGrade ?? 4);
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
                                border: `1px solid ${val !== null && val !== undefined ? (isPass ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)") : "var(--c-border)"}`,
                                color: val !== null && val !== undefined ? (isPass ? "#10b981" : "#f43f5e") : "var(--c-text)",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Promedio */}
                    {(() => {
                      const avg = calcAvg(selectedSubject.grades);
                      const passing = selectedSubject.passingGrade ?? 4;
                      const isPromoting = avg !== null && avg >= passing;
                      return avg !== null ? (
                        <div className="flex-none flex flex-col items-center justify-center pl-0 md:pl-5 md:border-l" style={{ borderColor: "var(--c-border)" }}>
                          <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-muted)" }}>Promedio</span>
                          <span className={`text-3xl font-black ${isPromoting ? "text-emerald-400" : "text-rose-400"}`}>{avg}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${isPromoting ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                            {isPromoting ? "✓ Promociona" : "✗ No promociona"}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              ) : null}

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
                  {units.filter((u) => u.subjectId === selectedSubject.id).length === 0 ? (
                    <p className="text-xs text-center py-6 border rounded-xl border-dashed" style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)" }}>Sin unidades. Agrega los temas de la materia arriba.</p>
                  ) : (
                    units.filter((u) => u.subjectId === selectedSubject.id).map((unit) => {
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

            </div>
          </div>
        </div>
      )}

      {/* ── Header Principal ── */}
      <div className="flex-none px-4 sm:px-6 py-4 flex items-center justify-between z-10" style={{ background: "var(--c-bg)" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight leading-none" style={{ color: "var(--c-text)" }}>Materias</h1>
          <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--c-text-muted)" }}>
            {units.filter(u => u.status === "aprendida").length} de {units.length} temas aprendidos
          </p>
        </div>
        <button type="button" onClick={() => { playSound("click"); setShowModal(true); }}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "var(--c-text)", color: "var(--c-bg)", boxShadow: "0 4px 14px rgba(255,255,255,0.1)" }}>
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Cuadrícula de Tarjetas Widget ── */}
      <div className="scroll-panel px-4 sm:px-6 py-2 pb-24">
        {subjects.length === 0 ? (
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
            {subjects.map((subject, index) => {
              const c = getColor(subject.color);
              const pct = getProgress(subject.id);
              const avg = calcAvg(subject.grades);
              const passing = subject.passingGrade ?? 4;
              const isPromoting = avg !== null && avg >= passing;
              const IconComp = subject.icon ? ICONS_MAP[subject.icon] : BookOpen;

              return (
                <button key={subject.id} type="button"
                  onClick={() => { playSound("tap"); setSelectedSubjectId(subject.id); }}
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
                      {subject.conditions && (
                        <p className="text-[10px] font-semibold mt-1 truncate" style={{ color: "var(--c-text-muted)" }}>
                          ⚠️ {subject.conditions}
                        </p>
                      )}
                    </div>
                    {/* Anillo de Progreso */}
                    <div className="flex-none">
                      <CircularProgress pct={pct} colorClass={c.text} size={50} stroke={4.5} />
                    </div>
                  </div>

                  <div className="relative z-10 flex items-end justify-between w-full mt-4 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-muted)" }}>Promedio</p>
                      {avg !== null ? (
                        <p className={`text-xl font-black ${isPromoting ? "text-emerald-400" : "text-rose-400"}`}>{avg}</p>
                      ) : (
                        <p className="text-xl font-black opacity-30" style={{ color: "var(--c-text-muted)" }}>-</p>
                      )}
                    </div>
                    {avg !== null && (
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${isPromoting ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {isPromoting ? "Promociona" : "No promociona"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
