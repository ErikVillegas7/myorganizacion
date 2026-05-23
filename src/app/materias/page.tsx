"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Plus, GraduationCap, Book, CheckSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSound } from "@/lib/use-sound";
import { filterActive, mergeById, normalizeItems, nowIso } from "@/lib/sync-utils";
import { ViewHelp } from "@/components/view-help";
import { SubjectCard } from "@/components/materias/subject-card";
import { SubjectModal } from "@/components/materias/subject-modal";
import { SubjectDetail } from "@/components/materias/subject-detail";
import { StatsBanner } from "@/components/materias/stats-banner";
import { STORAGE_KEYS } from "@/lib/materias/constants";
import { createId, getActualCondition, calcAttendancePct } from "@/lib/materias/utils";
import type { Subject, Unit } from "@/types/materias";

export default function MateriasPage() {
  const [subjects, setSubjects] = useLocalStorageState<Subject[]>(STORAGE_KEYS.subjects, [], { normalize: normalizeItems });
  const [units, setUnits] = useLocalStorageState<Unit[]>(STORAGE_KEYS.units, [], { normalize: normalizeItems });
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef({ subjects, units });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(() => typeof window !== "undefined" && window.location.hash === "#new");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null | undefined>(undefined);
  const playSound = useSound();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("subjectId");
    if (id) {
      setSelectedSubjectId(id);
      window.history.replaceState(null, "", "/materias");
    }
  }, []);

  useEffect(() => { localSnapshot.current = { subjects, units }; }, [subjects, units]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (sessionStorage.getItem("mo_cleared_all")) { sessionStorage.removeItem("mo_cleared_all"); setRemoteReady(true); return; }
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/subjects", { cache: "no-store" });
        if (!res.ok) { if (!cancelled) setRemoteReady(true); return; }
        const data = await res.json();
        const remS = normalizeItems((Array.isArray(data?.subjects) ? data.subjects : []) as Subject[]);
        const remU = normalizeItems((Array.isArray(data?.units) ? data.units : []) as Unit[]);
        const loc = { s: normalizeItems(localSnapshot.current.subjects), u: normalizeItems(localSnapshot.current.units) };
        const mergedS = mergeById(loc.s, remS);
        const mergedU = mergeById(loc.u, remU);
        if (remS.length === 0 && remU.length === 0 && (loc.s.length > 0 || loc.u.length > 0)) {
          await fetch("/api/subjects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjects: loc.s, units: loc.u }) });
        }
        if (!cancelled) { setSubjects(mergedS); setUnits(mergedU); }
      } catch {}
      if (!cancelled) setRemoteReady(true);
    };
    void run();
    return () => { cancelled = true; };
  }, [status, setSubjects, setUnits]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const t = window.setTimeout(() => {
      void fetch("/api/subjects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjects, units }) });
    }, 600);
    return () => window.clearTimeout(t);
  }, [status, remoteReady, subjects, units]);

  useEffect(() => { if (window.location.hash === "#new") window.history.replaceState(null, "", "/materias"); }, []);

  const activeSubjects = useMemo(() => filterActive(subjects), [subjects]);
  const activeUnits = useMemo(() => filterActive(units), [units]);
  const selectedSubject = activeSubjects.find(s => s.id === selectedSubjectId) ?? null;

  const yearGroups = useMemo(() => {
    const map = new Map<number | null, Subject[]>();
    for (const s of activeSubjects) {
      const k = s.year ?? null;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
  }, [activeSubjects]);

  useEffect(() => {
    if (selectedYear === undefined) {
      setSelectedYear(yearGroups[0]?.[0] ?? null);
    } else if (!yearGroups.some(([y]) => y === selectedYear)) {
      setSelectedYear(yearGroups[0]?.[0] ?? null);
    }
  }, [yearGroups, selectedYear]);

  const stats = useMemo(() => {
    const conds = activeSubjects.map(s => getActualCondition(s).label);
    return {
      total: activeSubjects.length,
      promocion: conds.filter(c => c === "Promoción").length,
      regular: conds.filter(c => c === "Regular").length,
      abandono: conds.filter(c => c === "Abandono").length,
      libre: conds.filter(c => c === "Libre").length,
      asistenciaRiesgo: activeSubjects.filter(s => {
        const pct = calcAttendancePct(s.clasesTotal, s.clasesAsistidas);
        return pct !== null && pct < (s.umbralAsistencia ?? 75);
      }).length,
    };
  }, [activeSubjects]);

  const buildSubject = (data: Partial<Subject>) => {
    const evalCount = data.evaluations ?? 2;
    const qCount = data.quizRequired ? (data.quizRequiredCount ?? 0) : 0;
    const wCount = data.groupWorkRequired ? (data.groupWorkRequiredCount ?? 0) : 0;
    return {
      id: createId(), name: data.name!, icon: data.icon, grade: "", conditions: data.conditions ?? "",
      manualCondition: data.manualCondition, quizRequired: data.quizRequired ?? false,
      quizRequiredCount: qCount, quizRequiredGrade: data.quizRequiredGrade ?? 6, quizGrades: Array(qCount).fill(null),
      groupWorkRequired: data.groupWorkRequired ?? false, groupWorkRequiredCount: wCount,
      groupWorkRequiredGrade: data.groupWorkRequiredGrade ?? 6, groupWorkGrades: Array(wCount).fill(null),
      finalGrade: null, color: data.color, type: data.type, kind: data.kind, evaluations: evalCount,
      regularGrade: data.regularGrade ?? null, promotionGrade: data.promotionGrade ?? null, grades: Array(evalCount).fill(null),
      clasesTotal: 0, clasesAsistidas: 0, umbralAsistencia: data.umbralAsistencia ?? 75,
      correlatividades: data.correlatividades ?? [], regularidadFecha: data.regularidadFecha ?? null,
      year: data.year, updatedAt: nowIso(), deletedAt: null,
    };
  };

  const handleCreateSubject = (data: Partial<Subject>) => {
    playSound("success");
    setSubjects(prev => [...prev, buildSubject(data)]);
  };

  const handleEditSubject = (data: Partial<Subject>) => {
    if (!editingSubject) return;
    playSound("success");
    const evalCount = data.evaluations ?? editingSubject.evaluations ?? 2;
    const oldG = editingSubject.grades ?? [];
    const newG = Array.from({ length: evalCount }, (_, i) => oldG[i] ?? null);
    const qCount = data.quizRequired ? (data.quizRequiredCount ?? editingSubject.quizRequiredCount ?? 1) : 0;
    const oldQ = editingSubject.quizGrades ?? [];
    const newQ = Array.from({ length: qCount }, (_, i) => oldQ[i] ?? null);
    const wCount = data.groupWorkRequired ? (data.groupWorkRequiredCount ?? editingSubject.groupWorkRequiredCount ?? 0) : 0;
    const oldW = editingSubject.groupWorkGrades ?? [];
    const newW = Array.from({ length: wCount }, (_, i) => oldW[i] ?? null);
    setSubjects(prev => prev.map(s => s.id === editingSubject.id ? {
      ...s, ...data, grades: newG, quizGrades: newQ, groupWorkGrades: newW,
      finalGrade: data.finalGrade ?? editingSubject.finalGrade ?? null,
      manualCondition: data.manualCondition, updatedAt: nowIso(),
    } : s));
    setEditingSubject(null);
  };

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...patch, updatedAt: nowIso() } : s));

  const handleUpdateGrade = (subjectId: string, idx: number, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const grades = [...(s.grades ?? [])];
      grades[idx] = num;
      return { ...s, grades, updatedAt: nowIso() };
    }));
  };

  const handleUpdateQuizGrade = (subjectId: string, idx: number, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const grades = [...(s.quizGrades ?? [])];
      grades[idx] = num;
      return { ...s, quizGrades: grades, updatedAt: nowIso() };
    }));
  };

  const handleUpdateWorkGrade = (subjectId: string, idx: number, value: string) => {
    const num = value === "" ? null : Number(value);
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const grades = [...(s.groupWorkGrades ?? [])];
      grades[idx] = num;
      return { ...s, groupWorkGrades: grades, updatedAt: nowIso() };
    }));
  };

  const handleUpdateFinalGrade = (subjectId: string, value: string) => {
    const num = value === "" ? null : Number(value);
    updateSubject(subjectId, { finalGrade: num });
  };

  const handleAsistencia = (subjectId: string, tipo: "presente" | "ausente") => {
    playSound(tipo === "presente" ? "success" : "pop");
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const total = (s.clasesTotal ?? 0) + 1;
      const asistidas = tipo === "presente" ? (s.clasesAsistidas ?? 0) + 1 : (s.clasesAsistidas ?? 0);
      return { ...s, clasesTotal: total, clasesAsistidas: asistidas, updatedAt: nowIso() };
    }));
  };

  const handleDeshacerClase = (subjectId: string) => {
    playSound("pop");
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const total = Math.max(0, (s.clasesTotal ?? 0) - 1);
      const asistidas = Math.min(s.clasesAsistidas ?? 0, total);
      return { ...s, clasesTotal: total, clasesAsistidas: asistidas, updatedAt: nowIso() };
    }));
  };

  const handleRemoveSubject = (id: string) => {
    playSound("pop");
    const now = nowIso();
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, deletedAt: now, updatedAt: now } : s));
    setUnits(prev => prev.map(u => u.subjectId === id ? { ...u, deletedAt: now, updatedAt: now } : u));
    setSelectedSubjectId(null);
  };

  const handleAddUnit = (subjectId: string, title: string) => {
    playSound("success");
    setUnits(prev => [...prev, { id: createId(), subjectId, title: title.trim(), status: "pendiente", updatedAt: nowIso(), deletedAt: null }]);
  };

  const handleRemoveUnit = (id: string) => {
    if (!window.confirm("¿Eliminar esta unidad?")) return;
    playSound("pop");
    const now = nowIso();
    setUnits(prev => prev.map(u => u.id === id ? { ...u, deletedAt: now, updatedAt: now } : u));
  };

  const cycleStatus = (unitId: string) => {
    playSound("tap");
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      const cycle: Unit["status"][] = ["pendiente", "en-clase", "aprendida"];
      const idx = cycle.indexOf(u.status);
      return { ...u, status: cycle[(idx + 1) % cycle.length], updatedAt: nowIso() };
    }));
  };

  const selected = selectedSubject;

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {(showModal || editingSubject) && (
        <SubjectModal
          initial={editingSubject ?? undefined}
          allSubjects={activeSubjects}
          onSave={editingSubject ? handleEditSubject : handleCreateSubject}
          onClose={() => { setShowModal(false); setEditingSubject(null); }}
          playSound={playSound}
        />
      )}

      {selected && (
        <SubjectDetail
          subject={selected}
          units={activeUnits}
          allSubjects={activeSubjects}
          onClose={() => setSelectedSubjectId(null)}
          onEdit={() => { playSound("tap"); setEditingSubject(selected); }}
          onPresente={() => handleAsistencia(selected.id, "presente")}
          onAusente={() => handleAsistencia(selected.id, "ausente")}
          onDeshacer={() => handleDeshacerClase(selected.id)}
          onUpdateGrade={(i, v) => handleUpdateGrade(selected.id, i, v)}
          onUpdateFinalGrade={(v) => handleUpdateFinalGrade(selected.id, v)}
          onUpdateQuizGrade={(i, v) => handleUpdateQuizGrade(selected.id, i, v)}
          onUpdateWorkGrade={(i, v) => handleUpdateWorkGrade(selected.id, i, v)}
          onAddUnit={(t) => handleAddUnit(selected.id, t)}
          onRemoveUnit={handleRemoveUnit}
          onCycleStatus={cycleStatus}
          onDeleteSubject={() => handleRemoveSubject(selected.id)}
          playSound={playSound}
        />
      )}

      <div className="flex-none px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between z-10 desktop-page-shell" style={{ background: "var(--c-bg)" }}>
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>
            {activeUnits.filter(u => u.status === "aprendida").length}/{activeUnits.length} temas · {stats.total} materias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewHelp title="Cómo usar Materias" steps={[
            { icon: <Book size={28}/>, title: "Organizá tu carrera", description: "Cargá todas tus materias, ya sean teóricas, taller o teórico-prácticas. Podés traerlas desde un plan precargado en Ajustes." },
            { icon: <CheckSquare size={28}/>, title: "Registrá temas y notas", description: "Añadí unidades a tus materias para marcar cuáles ya aprendiste, y llevá el control de tus calificaciones." },
            { icon: <GraduationCap size={28}/>, title: "Controlá la correlatividad", description: "Chequeá qué podés cursar agregándole condiciones o correlativas a cada materia." },
          ]} />
          <button type="button" onClick={() => { playSound("click"); setShowModal(true); }}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 bg-sky-500 text-white shadow-lg shadow-sky-500/20">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <StatsBanner stats={stats} />

      <div className="scroll-panel px-4 sm:px-6 lg:px-8 pb-24 lg:pb-10">
        <div className="desktop-page-shell">
          {activeSubjects.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-[var(--c-glass)] border flex items-center justify-center" style={{ borderColor: "var(--c-border)" }}>
                <GraduationCap size={28} className="opacity-40" />
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: "var(--c-text)" }}>Ninguna materia todavía</p>
                <p className="text-xs mt-1 max-w-[220px] mx-auto" style={{ color: "var(--c-text-muted)" }}>Creá tu primera materia y empezá a organizarte.</p>
              </div>
              <button type="button" onClick={() => { playSound("click"); setShowModal(true); }}
                className="rounded-full px-4 py-2 text-xs font-bold text-white bg-sky-500 transition-all active:scale-95 shadow-lg shadow-sky-500/20">
                Crear mi primera materia
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-1.5 mb-4 overflow-x-auto scroll-x pb-1" style={{ scrollbarWidth: "none" }}>
                {yearGroups.map(([year]) => (
                  <button key={year ?? "sin-ano"} type="button" onClick={() => { playSound("tap"); setSelectedYear(year); }}
                    className={`flex-none rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                      selectedYear === year ? "bg-sky-500/15 border-sky-500/30 text-sky-400" : "border-[var(--c-border)]"
                    }`}
                    style={selectedYear !== year ? { color: "var(--c-text-muted)", background: "var(--c-glass)" } : {}}>
                    {year ? `${year}° año` : "Sin año"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(yearGroups.find(([y]) => y === selectedYear)?.[1] ?? []).map((subject, index) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    units={activeUnits}
                    allSubjects={activeSubjects}
                    index={index}
                    onSelect={() => { playSound("tap"); setSelectedSubjectId(subject.id); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
