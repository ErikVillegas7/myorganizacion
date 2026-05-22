import { TrendingUp } from "lucide-react";
import type { Subject } from "@/types/materias";
import { calcAvg, evalLabel, getActualCondition } from "@/lib/materias/utils";

export function GradesTab({ subject, onUpdateGrade, onUpdateFinalGrade }: {
  subject: Subject;
  onUpdateGrade: (idx: number, value: string) => void;
  onUpdateFinalGrade: (value: string) => void;
}) {
  if (!subject.evaluations) {
    return <p className="text-sm text-center py-8" style={{ color: "var(--c-text-muted)" }}>Sin evaluaciones configuradas.</p>;
  }

  const avg = calcAvg(subject.grades);
  const isP = avg !== null && avg >= (subject.promotionGrade ?? 6);
  const isR = avg !== null && avg >= (subject.regularGrade ?? 4);

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--c-text-muted)" }}>
        <TrendingUp size={14} /> Notas y Promedio
      </h3>
      <div className="p-4 rounded-[20px] flex flex-col md:flex-row gap-5" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: subject.evaluations }, (_, i) => {
            const val = (subject.grades ?? [])[i];
            const isPromo = val !== null && val >= (subject.promotionGrade ?? 6);
            const isReg = val !== null && val >= (subject.regularGrade ?? 4);
            return (
              <div key={i}>
                <label className="text-[10px] font-semibold block mb-1 text-center" style={{ color: "var(--c-text-muted)" }}>{evalLabel(i, subject.evaluations!)}</label>
                <input type="number" min={1} max={10} step={0.5} value={val ?? ""} onChange={e => onUpdateGrade(i, e.target.value)} placeholder="—"
                  className="w-full rounded-xl px-3 py-2 text-center text-base font-bold focus:outline-none"
                  style={{
                    background: "var(--c-bg-2)",
                    border: `1px solid ${val !== null && val !== undefined ? (isPromo ? "rgba(16,185,129,0.3)" : isReg ? "rgba(234,179,8,0.3)" : "rgba(244,63,94,0.3)") : "var(--c-border)"}`,
                    color: val !== null && val !== undefined ? (isPromo ? "#10b981" : isReg ? "#ca8a04" : "#f43f5e") : "var(--c-text)",
                  }} />
              </div>
            );
          })}
        </div>
        {avg !== null && (
          <div className="flex-none flex flex-col items-center justify-center pl-0 md:pl-5 md:border-l" style={{ borderColor: "var(--c-border)" }}>
            <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-muted)" }}>Promedio</span>
            <span className={`text-3xl font-black ${isP ? "text-emerald-400" : isR ? "text-amber-400" : "text-rose-400"}`}>{avg}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${isP ? "bg-emerald-500/10 text-emerald-400" : isR ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"}`}>
              {isP ? "✓ Promociona" : isR ? "Regular" : "✗ No promo"}
            </span>
          </div>
        )}
      </div>

      {getActualCondition(subject).label === "Regular" && (
        <div className="rounded-[20px] border p-4" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--c-text)" }}>Nota de Final</p>
          <input type="number" min={1} max={10} step={0.5} value={subject.finalGrade ?? ""}
            onChange={e => onUpdateFinalGrade(e.target.value)} placeholder="Ej: 8"
            className="w-full rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none"
            style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
        </div>
      )}
    </div>
  );
}
