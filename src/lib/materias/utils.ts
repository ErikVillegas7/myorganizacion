import type { Subject, UnitStatus } from "@/types/materias";
import { SUBJECT_COLORS } from "./constants";

export const createId = () => crypto.randomUUID();

export const getColor = (id?: string) =>
  SUBJECT_COLORS.find(c => c.id === id) ?? SUBJECT_COLORS[0];

export const calcAttendancePct = (total?: number, attended?: number): number | null => {
  if (!total || total === 0) return null;
  return Math.round(((attended ?? 0) / total) * 100);
};

export const getAttendanceInfo = (pct: number | null, umbral = 75) => {
  if (pct === null) return { label: "Sin datos", textClass: "text-zinc-400", bgClass: "bg-zinc-500/10", ring: "var(--c-border-2)" };
  if (pct < umbral)     return { label: "En riesgo",  textClass: "text-rose-400",    bgClass: "bg-rose-500/10",    ring: "#f43f5e" };
  if (pct < umbral + 5) return { label: "Al límite",  textClass: "text-amber-400",   bgClass: "bg-amber-500/10",   ring: "#f59e0b" };
  return                       { label: "OK",          textClass: "text-emerald-400", bgClass: "bg-emerald-500/10", ring: "#10b981" };
};

export const calcRegularidadExpiracion = (fecha?: string | null) => {
  if (!fecha) return null;
  const expira = new Date(fecha);
  expira.setFullYear(expira.getFullYear() + 3);
  const hoy = new Date();
  const dias = Math.floor((expira.getTime() - hoy.getTime()) / 86400000);
  if (dias < 0)   return { dias, status: "expired" as const, expira };
  if (dias < 180) return { dias, status: "warning" as const, expira };
  return               { dias, status: "ok" as const, expira };
};

export const buildConditionLabel = (s: Subject) => {
  const p: string[] = [];
  if (s.quizRequired) p.push(`Quiz ${s.quizRequiredCount ?? 0}×≥${s.quizRequiredGrade ?? 1}`);
  if (s.groupWorkRequired) p.push(`TP grupal ${s.groupWorkRequiredCount ?? 0}×≥${s.groupWorkRequiredGrade ?? 1}`);
  if (s.conditions) p.push(s.conditions);
  return p.join(" · ");
};

export const buildConditionList = (s: Subject) => {
  const items: string[] = [];
  if (s.quizRequired) items.push(`Cuestionarios obligatorios: ${s.quizRequiredCount ?? 0}× con nota mínima ${s.quizRequiredGrade ?? 1}`);
  if (s.groupWorkRequired) items.push(`Trabajos grupales obligatorios: ${s.groupWorkRequiredCount ?? 0}× con nota mínima ${s.groupWorkRequiredGrade ?? 1}`);
  if (s.conditions) items.push(s.conditions);
  return items;
};

export const getActualCondition = (s: Subject) => {
  if (s.manualCondition === "Abandono") return { label: "Abandono", color: "rose", reason: "Marcado manualmente." };
  const grades = (s.grades ?? []).filter((g): g is number => g !== null && g !== undefined);
  const quizCount = s.quizRequired ? (s.quizRequiredCount ?? 0) : 0;
  const workCount = s.groupWorkRequired ? (s.groupWorkRequiredCount ?? 0) : 0;
  const quizGrades = (s.quizGrades ?? []).slice(0, quizCount);
  const workGrades = (s.groupWorkGrades ?? []).slice(0, workCount);
  const reg = s.regularGrade ?? 4;
  const prom = s.promotionGrade ?? 6;
  const hasGrades = grades.length > 0;
  const failsEvals = grades.some(g => g < reg);
  const allPromo = hasGrades && grades.every(g => g >= prom);
  const missingQuiz = quizCount > 0 && quizGrades.some(g => g === null || g === undefined);
  const missingWork = workCount > 0 && workGrades.some(g => g === null || g === undefined);
  const failsQuiz = quizCount > 0 && quizGrades.some(g => g !== null && g !== undefined && g < (s.quizRequiredGrade ?? 1));
  const failsWork = workCount > 0 && workGrades.some(g => g !== null && g !== undefined && g < (s.groupWorkRequiredGrade ?? 1));

  if (failsQuiz || failsWork) return { label: "Regular", color: "amber", reason: "Requisito obligatorio sin nota mínima." };
  if (failsEvals) return { label: "Abandono", color: "rose", reason: `Evaluación debajo de ${reg}.` };
  if (allPromo && !missingQuiz && !missingWork) return { label: "Promoción", color: "emerald", reason: `Todas ≥${prom} y requisitos cumplidos.` };
  if (hasGrades || missingQuiz || missingWork) return { label: "Regular", color: "amber", reason: "Notas entre umbrales o requisito incompleto." };
  return { label: "Libre", color: "zinc", reason: "Sin notas." };
};

export const conditionPillClasses = (c: string) => {
  if (c === "Promoción") return "bg-emerald-500/10 text-emerald-400";
  if (c === "Regular")   return "bg-amber-500/10 text-amber-400";
  if (c === "Abandono")  return "bg-rose-500/10 text-rose-400";
  return "bg-zinc-500/10 text-zinc-400";
};

export const calcAvg = (grades?: (number | null)[]): number | null => {
  if (!grades) return null;
  const filled = grades.filter((g): g is number => g !== null && g !== undefined);
  if (!filled.length) return null;
  return Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10;
};

export const evalLabel = (idx: number, total: number) => {
  if (total === 1) return "Nota";
  if (total === 2) return idx === 0 ? "Parcial 1" : "Parcial 2";
  return `Eval ${idx + 1}`;
};

export const getSubjectProgress = (subjectId: string, units: { subjectId: string; status: UnitStatus }[]) => {
  const su = units.filter(u => u.subjectId === subjectId);
  if (!su.length) return 0;
  return Math.round((su.filter(u => u.status === "aprendida").length / su.length) * 100);
};

export function isCorrelativesOk(subject: Subject, allSubjects: Subject[]) {
  if (!subject.correlatividades?.length) return true;
  return subject.correlatividades.every(corrId => {
    const corr = allSubjects.find(s => s.id === corrId);
    if (!corr) return false;
    const cond = getActualCondition(corr);
    return cond.label === "Promoción" || cond.label === "Regular";
  });
}
