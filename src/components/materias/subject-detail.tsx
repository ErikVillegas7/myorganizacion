"use client";

import { useState } from "react";
import { X, Settings2, BookOpen, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Subject, Unit } from "@/types/materias";
import type { TabId } from "@/types/materias";
import { ICONS_MAP, MATERIA_KINDS, TAB_OPTIONS } from "@/lib/materias/constants";
import { getColor, getActualCondition, conditionPillClasses } from "@/lib/materias/utils";
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
  const c = getColor(subject.color);
  const IconComp: LucideIcon = (subject.icon && ICONS_MAP[subject.icon]) ? ICONS_MAP[subject.icon]! : BookOpen;
  const cond = getActualCondition(subject);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 top-[8%] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.4)] flex flex-col anim-slide-up desktop-dialog"
        style={{ "--dialog-w": "52rem", "--dialog-h": "88vh", background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" } as React.CSSProperties}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-none px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)", borderRadius: "1.5rem 1.5rem 0 0" }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
              <IconComp size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--c-text)" }}>{subject.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold" style={{ color: "var(--c-text-muted)" }}>
                  {subject.type === "anual" ? "Anual" : "Cuatrimestral"}
                  {subject.kind ? ` · ${MATERIA_KINDS.find(k => k.id === subject.kind)?.label ?? ""}` : ""}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${conditionPillClasses(cond.label)}`}>
                  {cond.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { playSound("tap"); onEdit(); }} className="p-2 rounded-full hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
              <Settings2 size={18} />
            </button>
            <button onClick={() => { playSound("tap"); onClose(); }} className="p-2 rounded-full bg-white/[0.05]" style={{ color: "var(--c-text)" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-none px-5 pt-3 pb-1 flex gap-2 overflow-x-auto scroll-x">
          {TAB_OPTIONS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex-none rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${tab === t.id ? "bg-[var(--c-text)] text-[var(--c-bg)]" : "bg-[var(--c-bg-2)]"}`}
              style={tab !== t.id ? { color: "var(--c-text)" } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-panel p-5 space-y-5">
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

          {tab === "temario" && (
            <div className="pt-4">
              <button type="button" onClick={() => { if (window.confirm("¿Seguro que querés eliminar esta materia?")) onDeleteSubject(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/20 text-rose-500 bg-rose-500/5 text-xs font-bold">
                <Trash2 size={14} /> Eliminar Materia
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
