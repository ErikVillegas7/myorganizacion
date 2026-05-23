import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import type { Subject } from "@/types/materias";
import { calcRegularidadExpiracion, buildConditionList } from "@/lib/materias/utils";

function GradeInput({ defaultValue, onBlur }: { defaultValue: string; onBlur: (v: string) => void }) {
  const [val, setVal] = useState(defaultValue);

  useEffect(() => { setVal(defaultValue); }, [defaultValue]);

  return (
    <input type="number" min={1} max={10} step={0.5} value={val}
      onChange={e => setVal(e.target.value)} onBlur={() => onBlur(val)}
      placeholder="Nota"
      className="w-full rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
      style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
  );
}

export function ConditionsTab({ subject, onUpdateQuizGrade, onUpdateWorkGrade }: {
  subject: Subject;
  onUpdateQuizGrade?: (idx: number, value: string) => void;
  onUpdateWorkGrade?: (idx: number, value: string) => void;
}) {
  const [showQuizReq, setShowQuizReq] = useState(false);
  const [showWorkReq, setShowWorkReq] = useState(false);

  const handleQuizBlur = useCallback((i: number, v: string) => {
    onUpdateQuizGrade?.(i, v);
  }, [onUpdateQuizGrade]);

  const handleWorkBlur = useCallback((i: number, v: string) => {
    onUpdateWorkGrade?.(i, v);
  }, [onUpdateWorkGrade]);

  return (
    <div className="space-y-4">
      {(() => {
        const exp = calcRegularidadExpiracion(subject.regularidadFecha);
        if (!exp) return null;
        const { dias, status: s, expira } = exp;
        const bgBorder = s === "expired" ? "bg-rose-500/10 border-rose-500/20" : s === "warning" ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20";
        const textC = s === "expired" ? "text-rose-400" : s === "warning" ? "text-amber-400" : "text-emerald-400";
        return (
          <div className={`rounded-2xl border p-4 ${bgBorder}`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className={textC} />
              <p className={`text-sm font-bold ${textC}`}>
                {s === "expired" ? "Regularidad VENCIDA" : s === "warning" ? "Regularidad próxima a vencer" : "Regularidad vigente"}
              </p>
            </div>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              {s === "expired"
                ? `Venció hace ${Math.abs(dias)} días. Necesitás recursar.`
                : `Vence el ${expira.toLocaleDateString("es-AR")} — faltan ${dias} días.`}
            </p>
          </div>
        );
      })()}

      <div className="rounded-[24px] border p-4" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-text-muted)" }}>Condiciones de cursada</h3>
        {buildConditionList(subject).length === 0 ? (
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Sin condiciones adicionales configuradas.</p>
        ) : (
          <ul className="space-y-2 text-sm" style={{ color: "var(--c-text)" }}>
            {buildConditionList(subject).map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">•</span><span>{item}</span></li>
            ))}
          </ul>
        )}
      </div>

      {subject.quizRequired && (subject.quizRequiredCount ?? 0) > 0 && (
        <div className="rounded-[24px] border p-4" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
          <button type="button" onClick={() => setShowQuizReq(p => !p)} className="w-full flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              Cuestionarios ({subject.quizRequiredCount} × mín. {subject.quizRequiredGrade})
            </p>
            <span className="text-xs font-bold" style={{ color: "var(--c-text-muted)" }}>{showQuizReq ? "▲" : "▼"}</span>
          </button>
          {showQuizReq && onUpdateQuizGrade && (
            <div className="mt-3 flex gap-2 overflow-x-auto scroll-x pb-1" style={{ scrollbarWidth: "none" }}>
              {Array.from({ length: subject.quizRequiredCount ?? 0 }, (_, i) => (
                <label key={i} className="flex-none w-36 rounded-2xl border px-3 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-glass)" }}>
                  <p className="text-xs font-semibold mb-2 text-center" style={{ color: "var(--c-text-muted)" }}>Cuestionario {i + 1}</p>
                  <GradeInput
                    defaultValue={String((subject.quizGrades ?? [])[i] ?? "")}
                    onBlur={v => handleQuizBlur(i, v)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {subject.groupWorkRequired && (subject.groupWorkRequiredCount ?? 0) > 0 && (
        <div className="rounded-[24px] border p-4" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
          <button type="button" onClick={() => setShowWorkReq(p => !p)} className="w-full flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              Trabajos grupales ({subject.groupWorkRequiredCount} × mín. {subject.groupWorkRequiredGrade})
            </p>
            <span className="text-xs font-bold" style={{ color: "var(--c-text-muted)" }}>{showWorkReq ? "▲" : "▼"}</span>
          </button>
          {showWorkReq && onUpdateWorkGrade && (
            <div className="mt-3 flex gap-2 overflow-x-auto scroll-x pb-1" style={{ scrollbarWidth: "none" }}>
              {Array.from({ length: subject.groupWorkRequiredCount ?? 0 }, (_, i) => (
                <label key={i} className="flex-none w-36 rounded-2xl border px-3 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-glass)" }}>
                  <p className="text-xs font-semibold mb-2 text-center" style={{ color: "var(--c-text-muted)" }}>Trabajo {i + 1}</p>
                  <GradeInput
                    defaultValue={String((subject.groupWorkGrades ?? [])[i] ?? "")}
                    onBlur={v => handleWorkBlur(i, v)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
