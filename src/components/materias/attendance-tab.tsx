import { CheckCircle2, X, Minus } from "lucide-react";
import type { Subject } from "@/types/materias";
import { calcAttendancePct, getAttendanceInfo } from "@/lib/materias/utils";

export function AttendanceTab({ subject, onPresente, onAusente, onDeshacer }: {
  subject: Subject;
  onPresente: () => void;
  onAusente: () => void;
  onDeshacer: () => void;
}) {
  const pct = calcAttendancePct(subject.clasesTotal, subject.clasesAsistidas);
  const umbral = subject.umbralAsistencia ?? 75;
  const info = getAttendanceInfo(pct, umbral);
  const total = subject.clasesTotal ?? 0;
  const asistidas = subject.clasesAsistidas ?? 0;
  const ausentes = total - asistidas;
  const pctNum = pct ?? 0;
  const targetClases = Math.ceil(total * (umbral / 100));
  const faltanParaUmbral = Math.max(0, targetClases - asistidas);
  const margen = pct !== null && pct >= umbral ? Math.floor((asistidas - targetClases)) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] p-5 flex flex-col sm:flex-row items-center gap-6" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
        <div className="relative flex-none" style={{ width: 120, height: 120 }}>
          {(() => {
            const sz = 120, sw = 10, rad = (sz - sw) / 2, circ = rad * 2 * Math.PI;
            const off = pct !== null ? circ - (Math.min(pctNum, 100) / 100) * circ : circ;
            return (
              <svg className="transform -rotate-90" width={sz} height={sz}>
                <circle cx={sz/2} cy={sz/2} r={rad} fill="none" stroke="var(--c-border)" strokeWidth={sw} />
                <circle cx={sz/2} cy={sz/2} r={rad} fill="none" stroke={info.ring} strokeWidth={sw}
                  strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }} />
              </svg>
            );
          })()}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${info.textClass}`}>{pct !== null ? `${pctNum}%` : "—"}</span>
            <span className={`text-[10px] font-bold ${info.textClass}`}>{info.label}</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl p-3" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
              <p className="text-xl font-black" style={{ color: "var(--c-text)" }}>{total}</p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--c-text-muted)" }}>Total</p>
            </div>
            <div className="rounded-2xl p-3 bg-emerald-500/10">
              <p className="text-xl font-black text-emerald-400">{asistidas}</p>
              <p className="text-[10px] font-semibold text-emerald-400/70 mt-0.5">Presentes</p>
            </div>
            <div className="rounded-2xl p-3 bg-rose-500/10">
              <p className="text-xl font-black text-rose-400">{ausentes}</p>
              <p className="text-[10px] font-semibold text-rose-400/70 mt-0.5">Ausentes</p>
            </div>
          </div>

          <div className="text-xs rounded-2xl p-3" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
            Umbral: <strong style={{ color: "var(--c-text)" }}>{umbral}%</strong>
            {faltanParaUmbral > 0
              ? <> · Necesitás <strong className="text-amber-400">{faltanParaUmbral} presencias más</strong> para alcanzarlo</>
              : margen > 0
                ? <> · Tenés margen de <strong className="text-emerald-400">{margen} faltas</strong> más</>
                : total === 0 ? " · Registrá tu primera clase abajo." : <> · <strong className="text-amber-400">No podés faltar más.</strong></>
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button type="button" onClick={onPresente}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">Presente</span>
        </button>
        <button type="button" onClick={onAusente}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all">
          <X size={24} className="text-rose-400" />
          <span className="text-xs font-bold text-rose-400">Ausente</span>
        </button>
        <button type="button" onClick={onDeshacer}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 border active:scale-95 transition-all"
          style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
          <Minus size={24} />
          <span className="text-xs font-bold">Deshacer</span>
        </button>
      </div>

      <p className="text-[10px] text-center" style={{ color: "var(--c-text-muted)" }}>
        Cada botón suma una clase al total. "Deshacer" borra la última clase registrada.
      </p>
    </div>
  );
}
