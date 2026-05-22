import { BookOpen, AlertTriangle, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Subject, Unit } from "@/types/materias";
import { MATERIA_KINDS, ICONS_MAP } from "@/lib/materias/constants";
import {
  getColor, calcAvg, getActualCondition, conditionPillClasses,
  calcAttendancePct, getAttendanceInfo, getSubjectProgress, isCorrelativesOk, buildConditionLabel,
} from "@/lib/materias/utils";
import { CircularProgress } from "./circular-progress";

export function SubjectCard({ subject, units, allSubjects, onSelect, index = 0 }: {
  subject: Subject;
  units: Unit[];
  allSubjects: Subject[];
  onSelect: () => void;
  index?: number;
}) {
  const c = getColor(subject.color);
  const pct = getSubjectProgress(subject.id, units);
  const avg = calcAvg(subject.grades);
  const cond = getActualCondition(subject);
  const attendancePct = calcAttendancePct(subject.clasesTotal, subject.clasesAsistidas);
  const attInfo = getAttendanceInfo(attendancePct, subject.umbralAsistencia ?? 75);
  const corrWarning = !isCorrelativesOk(subject, allSubjects);
  const IconComp: LucideIcon = (subject.icon && ICONS_MAP[subject.icon]) ? ICONS_MAP[subject.icon]! : BookOpen;

  return (
    <button type="button" onClick={onSelect}
      className="relative p-5 rounded-[24px] transition-all hover:scale-[1.02] active:scale-95 text-left flex flex-col justify-between overflow-hidden anim-slide-up"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--shadow)", minHeight: "175px", animationDelay: `${index * 0.05}s` }}>

      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none" style={{ background: c.hex }} />

      <div className="flex items-start justify-between relative z-10 w-full">
        <div className="flex-1 pr-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${c.bg} ${c.text}`}>
            <IconComp size={20} strokeWidth={2} />
          </div>
          <h3 className="font-bold text-[15px] leading-tight truncate" style={{ color: "var(--c-text)" }}>{subject.name}</h3>
          {subject.kind && (
            <p className="text-[10px] font-semibold mt-0.5 opacity-60" style={{ color: "var(--c-text-muted)" }}>
              {MATERIA_KINDS.find(k => k.id === subject.kind)?.label}
              {buildConditionLabel(subject) ? ` · ${buildConditionLabel(subject)}` : ""}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${conditionPillClasses(cond.label)}`}>
              {cond.label}
            </span>
            {corrWarning && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-400">
                <AlertTriangle size={9} /> Correlativas
              </span>
            )}
          </div>
        </div>
        <div className="flex-none">
          <CircularProgress pct={pct} colorClass={c.text} size={50} stroke={4.5} />
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between w-full mt-4 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-muted)" }}>Promedio</p>
          <p className={`text-xl font-black ${avg !== null && avg >= (subject.promotionGrade ?? 6) ? "text-emerald-400" : avg !== null ? "text-amber-400" : "opacity-30"}`}
            style={avg === null ? { color: "var(--c-text-muted)" } : {}}>
            {avg ?? "—"}
          </p>
        </div>
        {attendancePct !== null && (
          <div className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 ${attInfo.bgClass}`}>
            <UserCheck size={12} className={attInfo.textClass} />
            <span className={`text-[11px] font-bold ${attInfo.textClass}`}>{attendancePct}%</span>
          </div>
        )}
      </div>
    </button>
  );
}
