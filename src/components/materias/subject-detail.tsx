"use client";

import { useState } from "react";
import { X, Settings2, BookOpen, Trash2, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Subject, Unit } from "@/types/materias";
import type { TabId } from "@/types/materias";
import { ICONS_MAP, MATERIA_KINDS, TAB_OPTIONS } from "@/lib/materias/constants";
import { getColor, getActualCondition, conditionPillClasses, isSubjectIncomplete } from "@/lib/materias/utils";
import { ConditionsTab } from "./conditions-tab";
import { AttendanceTab } from "./attendance-tab";
import { GradesTab } from "./grades-tab";
import { CorrelativesTab } from "./correlatives-tab";
import { SyllabusTab } from "./syllabus-tab";
import type { SoundType } from "@/lib/use-sound";

type DetailProps = {
  subject: Subject;
  units: Unit[];
  allSubjects: Subject[];
  onClose: () => void;
  onEdit: () => void;
  onPresente: () => void;
  onAusente: () => void;
  onDeshacer: () => void;
  onUpdateGrade: (idx: number, value: string) => void;
  onUpdateFinalGrade: (value: string) => void;
  onUpdateQuizGrade: (idx: number, value: string) => void;
  onUpdateWorkGrade: (idx: number, value: string) => void;
  onAddUnit: (title: string) => void;
  onRemoveUnit: (id: string) => void;
  onCycleStatus: (id: string) => void;
  onDeleteSubject: () => void;
  playSound: (s: SoundType) => void;
};

export function SubjectDetail(props: DetailProps) {
  const { subject, units, allSubjects, onClose, onEdit, onPresente, onAusente, onDeshacer,
    onUpdateGrade, onUpdateFinalGrade, onUpdateQuizGrade, onUpdateWorkGrade,
    onAddUnit, onRemoveUnit, onCycleStatus, onDeleteSubject, playSound } = props;
  const [tab, setTab] = useState<TabId>("condiciones");
  const [showMenu, setShowMenu] = useState(false);
  const c = getColor(subject.color);
  const IconComp: LucideIcon = (subject.icon && ICONS_MAP[subject.icon]) ? ICONS_MAP[subject.icon]! : BookOpen;
  const cond = getActualCondition(subject);
  const incomplete = isSubjectIncomplete(subject);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 top-[4%] sm:top-[8%] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.4)] flex flex-col anim-slide-up desktop-dialog"
        style={{ "--dialog-w": "52rem", "--dialog-h": "88vh", background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" } as React.CSSProperties}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-none px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)", borderRadius: "1.5rem 1.5rem 0 0" }}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>
              <IconComp size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate" style={{ color: "var(--c-text)" }}>{subject.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold truncate" style={{ color: "var(--c-text-muted)" }}>
                  {subject.type === "anual" ? "Anual" : "Cuatrimestral"}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${conditionPillClasses(cond.label)}`}>
                  {cond.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <div className="relative">
              <button onClick={() => { playSound("tap"); setShowMenu(p => !p); }} className="p-2 rounded-full hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl border p-1.5 z-20 shadow-lg anim-scale-in" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
                    <button onClick={() => { playSound("tap"); onEdit(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/[0.05] text-left" style={{ color: "var(--c-text)" }}>
                      <Settings2 size={15} /> Editar
                    </button>
                    <button onClick={() => { if (window.confirm("¿Seguro que querés eliminar esta materia?")) { onDeleteSubject(); setShowMenu(false); } }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/[0.05] text-left" style={{ color: "var(--c-text)" }}>
                      <Trash2 size={15} className="text-rose-400" /> Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => { playSound("tap"); onClose(); }} className="p-2 rounded-full hover:bg-white/[0.05]" style={{ color: "var(--c-text)" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {incomplete && (
          <div className="flex-none mx-4 sm:mx-5 mt-3 px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-2">
            <p className="text-xs font-semibold text-sky-400 flex-1">
              Esta materia está incompleta. Tocá <span className="font-black">Editar</span> y completala con la información de tu docente.
            </p>
            <button onClick={() => { playSound("tap"); onEdit(); }} className="text-xs font-bold text-white bg-sky-500 px-3 py-1.5 rounded-lg hover:bg-sky-400 transition-all active:scale-95 shrink-0">
              Editar
            </button>
          </div>
        )}

        <div className="flex-none px-4 sm:px-5 pt-2.5 pb-1 flex gap-1.5 overflow-x-auto scroll-x" style={{ scrollbarWidth: "none" }}>
          {TAB_OPTIONS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex-none rounded-full px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap ${tab === t.id ? "bg-[var(--c-text)] text-[var(--c-bg)]" : "bg-[var(--c-bg-2)]"}`}
              style={tab !== t.id ? { color: "var(--c-text)" } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-panel p-4 sm:p-5 space-y-4 sm:space-y-5">
          {tab === "condiciones" && (
            <ConditionsTab
              subject={subject}
              onUpdateQuizGrade={onUpdateQuizGrade}
              onUpdateWorkGrade={onUpdateWorkGrade}
            />
          )}

          {tab === "asistencia" && (
            <AttendanceTab
              subject={subject}
              onPresente={onPresente}
              onAusente={onAusente}
              onDeshacer={onDeshacer}
            />
          )}

          {tab === "notas" && (
            <GradesTab
              subject={subject}
              onUpdateGrade={onUpdateGrade}
              onUpdateFinalGrade={onUpdateFinalGrade}
            />
          )}

          {tab === "correlativas" && (
            <CorrelativesTab
              subject={subject}
              allSubjects={allSubjects}
            />
          )}

          {tab === "temario" && (
            <SyllabusTab
              subject={subject}
              units={units}
              onAddUnit={onAddUnit}
              onRemoveUnit={onRemoveUnit}
              onCycleStatus={onCycleStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}
