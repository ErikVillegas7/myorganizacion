import { BookOpen, CheckCircle2, AlertTriangle, Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Subject } from "@/types/materias";
import { ICONS_MAP } from "@/lib/materias/constants";
import { getColor, getActualCondition, conditionPillClasses } from "@/lib/materias/utils";

export function CorrelativesTab({ subject, allSubjects }: {
  subject: Subject;
  allSubjects: Subject[];
}) {
  if (!subject.correlatividades?.length) {
    return (
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Materias requeridas</h3>
        <div className="py-10 text-center rounded-2xl border border-dashed" style={{ borderColor: "var(--c-border)" }}>
          <Link2 size={28} className="mx-auto mb-2 opacity-30" style={{ color: "var(--c-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Sin correlatividades.</p>
          <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>Editá la materia para agregarlas.</p>
        </div>
      </div>
    );
  }

  const allOk = subject.correlatividades.every(corrId => {
    const corr = allSubjects.find(s => s.id === corrId);
    if (!corr) return false;
    const cond = getActualCondition(corr);
    return cond.label === "Promoción" || cond.label === "Regular";
  });

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>Materias requeridas</h3>
      <div className="space-y-2">
        {subject.correlatividades.map(corrId => {
          const corr = allSubjects.find(s => s.id === corrId);
          if (!corr) return (
            <div key={corrId} className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-500/20 bg-zinc-500/5">
              <p className="text-sm text-zinc-400">Materia eliminada ({corrId.slice(0, 8)})</p>
            </div>
          );
          const cond = getActualCondition(corr);
          const c = getColor(corr.color);
          const ok = cond.label === "Promoción" || cond.label === "Regular";
          const IconComp: LucideIcon = (corr.icon && ICONS_MAP[corr.icon]) ? ICONS_MAP[corr.icon]! : BookOpen;
          return (
            <div key={corrId} className={`flex items-center gap-3 p-3 rounded-2xl border ${ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${c.bg} ${c.text}`}>
                <IconComp size={16} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{corr.name}</p>
                <p className={`text-[11px] font-semibold ${conditionPillClasses(cond.label).split(" ")[1]}`}>{cond.label}</p>
              </div>
              {ok ? <CheckCircle2 size={18} className="text-emerald-400 flex-none" /> : <AlertTriangle size={18} className="text-rose-400 flex-none" />}
            </div>
          );
        })}
      </div>

      <div className={`rounded-2xl p-4 border ${allOk ? "bg-emerald-500/8 border-emerald-500/20" : "bg-rose-500/8 border-rose-500/20"}`}>
        {allOk
          ? <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} /> Todas las correlatividades cumplidas.</p>
          : <p className="text-sm font-semibold text-rose-400 flex items-center gap-2"><AlertTriangle size={16} /> Hay correlatividades pendientes.</p>
        }
      </div>
    </div>
  );
}
