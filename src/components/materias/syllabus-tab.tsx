import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Subject, Unit, UnitStatus } from "@/types/materias";
import { STATUS_CYCLE, STATUS_META } from "@/lib/materias/constants";

export function SyllabusTab({ subject, units, onAddUnit, onRemoveUnit, onCycleStatus }: {
  subject: Subject;
  units: Unit[];
  onAddUnit: (title: string) => void;
  onRemoveUnit: (id: string) => void;
  onCycleStatus: (id: string) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const subjectUnits = units.filter(u => u.subjectId === subject.id);

  const handleAdd = () => {
    const t = newTitle.trim();
    if (!t) return;
    onAddUnit(t);
    setNewTitle("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Nueva unidad o tema..."
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
          style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
        <button type="button" onClick={handleAdd}
          className="flex-none w-11 h-11 rounded-xl bg-[var(--c-text)] text-[var(--c-bg)] flex items-center justify-center active:scale-95">
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="space-y-2">
        {subjectUnits.length === 0 ? (
          <p className="text-xs text-center py-6 border rounded-xl border-dashed" style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)" }}>Sin unidades. Agregá los temas arriba.</p>
        ) : (
          subjectUnits.map(unit => {
            const sm = STATUS_META[unit.status];
            return (
              <div key={unit.id} className="flex items-center justify-between p-3 rounded-[16px] border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
                <button type="button" onClick={() => onCycleStatus(unit.id)} className="flex-1 flex items-center gap-3 text-left">
                  <span className={`flex items-center gap-1.5 flex-none ${sm.bg} ${sm.text} ${sm.border} text-[10px] font-bold px-2.5 py-1 rounded-full border`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}
                  </span>
                  <span className={`text-sm font-bold truncate ${unit.status === "aprendida" ? "line-through opacity-50" : ""}`} style={{ color: "var(--c-text)" }}>{unit.title}</span>
                </button>
                <button type="button" onClick={() => onRemoveUnit(unit.id)} className="p-2 rounded-lg text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 ml-2">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
