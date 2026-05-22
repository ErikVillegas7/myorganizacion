"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, CheckCircle2, XCircle, BookOpen, GitBranch } from "lucide-react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { filterActive, normalizeItems } from "@/lib/sync-utils";
import { STORAGE_KEYS } from "@/lib/materias/constants";
import { getActualCondition, getColor } from "@/lib/materias/utils";
import { PLAN_TEMPLATES, PLAN_STORAGE_KEY } from "@/lib/materias/plan-templates";
import type { Subject } from "@/types/materias";

type PlanStatus = {
  label: string;
  icon: any;
  badgeBg: string;
  badgeText: string;
  unlocked: boolean;
  greenBorder: boolean;
};

function getPlanStatus(subject: Subject, pendiente: boolean) {
  if (pendiente) {
    return {
      label: "Pendiente", icon: Lock,
      badgeBg: "bg-zinc-500/15", badgeText: "text-zinc-400",
      unlocked: false, greenBorder: false,
    } as PlanStatus;
  }
  const cond = getActualCondition(subject);
  if (cond.label === "Abandono") {
    return {
      label: "Abandono", icon: XCircle,
      badgeBg: "bg-rose-500/15", badgeText: "text-rose-400",
      unlocked: true, greenBorder: false,
    } as PlanStatus;
  }
  if (cond.label === "Promoción" || cond.label === "Regular") {
    return {
      label: "Aprobada", icon: CheckCircle2,
      badgeBg: "bg-emerald-500/15", badgeText: "text-emerald-400",
      unlocked: true, greenBorder: true,
    } as PlanStatus;
  }
  return {
    label: "Cursando", icon: BookOpen,
    badgeBg: "bg-blue-500/15", badgeText: "text-blue-400",
    unlocked: true, greenBorder: false,
  } as PlanStatus;
}

function groupByYear(subjects: Subject[]): [number | null, Subject[]][] {
  const map = new Map<number | null, Subject[]>();
  for (const s of subjects) {
    const key = s.year ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });
}

function computeDepth(id: string, subs: Subject[], memo: Map<string, number>): number {
  const cached = memo.get(id);
  if (cached !== undefined) return cached;
  const s = subs.find(x => x.id === id);
  if (!s || !s.correlatividades?.length) {
    memo.set(id, 0);
    return 0;
  }
  let max = 0;
  for (const cid of s.correlatividades) {
    max = Math.max(max, computeDepth(cid, subs, memo) + 1);
  }
  memo.set(id, max);
  return max;
}

function corrUnlocked(corr: Subject | undefined) {
  if (!corr) return true;
  const cond = getActualCondition(corr);
  return cond.label === "Promoción" || cond.label === "Regular";
}

type LineData = { d: string; fromId: string; toId: string };

function normalizeName(n: string) {
  return n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function subjectExists(existing: Subject[], s: Subject) {
  const norm = normalizeName(s.name);
  return existing.some(e => e.id === s.id || (norm && normalizeName(e.name) === norm));
}

type PendingPlan = { key: string; label: string; subjects: Subject[] } | null;

export default function PlanPage() {
  const [subjects, setSubjects] = useLocalStorageState<Subject[]>(STORAGE_KEYS.subjects, [], { normalize: normalizeItems });
  const [planKey, setPlanKey] = useLocalStorageState<string | null>(PLAN_STORAGE_KEY, null);
  const [pendingPlan, setPendingPlan] = useState<PendingPlan>(null);
  const router = useRouter();
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const mobileInnerRef = useRef<HTMLDivElement>(null);
  const deskContainerRef = useRef<HTMLDivElement>(null);
  const deskInnerRef = useRef<HTMLDivElement>(null);
  const [mobileLines, setMobileLines] = useState<LineData[]>([]);
  const [deskLines, setDeskLines] = useState<LineData[]>([]);
  const [svgDims, setSvgDims] = useState({ w: 0, h: 0 });
  const [deskSvgDims, setDeskSvgDims] = useState({ w: 0, h: 0 });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null | undefined>(undefined);

  const activeSubjects = useMemo(() => filterActive(subjects), [subjects]);
  const groups = useMemo(() => groupByYear(activeSubjects), [activeSubjects]);
  const hasYearData = useMemo(() => activeSubjects.some(s => s.year != null), [activeSubjects]);

  const unlockedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of activeSubjects) {
      if (!s.correlatividades || s.correlatividades.length === 0) {
        ids.add(s.id);
      } else {
        const all = s.correlatividades.every(cid => corrUnlocked(activeSubjects.find(c => c.id === cid)));
        if (all) ids.add(s.id);
      }
    }
    return ids;
  }, [activeSubjects]);

  const depthMap = useMemo(() => {
    const memo = new Map<string, number>();
    for (const s of activeSubjects) computeDepth(s.id, activeSubjects, memo);
    return memo;
  }, [activeSubjects]);

  const sortedGroups = useMemo(() =>
    groups.map(([year, subs]) => [
      year,
      [...subs].sort((a, b) => (depthMap.get(a.id) ?? 0) - (depthMap.get(b.id) ?? 0)),
    ] as [number | null, Subject[]]),
  [groups, depthMap]);

  const currentYearSubjects = useMemo(() => sortedGroups.find(([y]) => y === selectedYear)?.[1] ?? [], [sortedGroups, selectedYear]);

  useEffect(() => {
    if (selectedYear === undefined) {
      setSelectedYear(sortedGroups[0]?.[0] ?? null);
    } else if (!sortedGroups.some(([y]) => y === selectedYear)) {
      setSelectedYear(sortedGroups[0]?.[0] ?? null);
    }
  }, [sortedGroups, selectedYear]);

  const headerStats = useMemo(() => {
    let aprobadas = 0, cursando = 0, pendientes = 0;
    for (const s of activeSubjects) {
      if (!unlockedIds.has(s.id)) { pendientes++; continue; }
      const cond = getActualCondition(s);
      if (cond.label === "Promoción" || cond.label === "Regular") { aprobadas++; continue; }
      if (cond.label === "Abandono") continue;
      cursando++;
    }
    return { aprobadas, cursando, pendientes };
  }, [activeSubjects, unlockedIds]);

  const recalcMobile = useCallback(() => {
    const inner = mobileInnerRef.current;
    if (!inner) return;
    const containerRect = inner.getBoundingClientRect();
    const result: LineData[] = [];
    const currentIds = new Set(currentYearSubjects.map(s => s.id));

    for (const subject of currentYearSubjects) {
      if (!subject.correlatividades?.length) continue;
      const subjEl = inner.querySelector(`[data-subject-id="${subject.id}"]`) as HTMLElement | null;
      if (!subjEl) continue;
      const subjRect = subjEl.getBoundingClientRect();

      for (const corrId of subject.correlatividades) {
        if (!currentIds.has(corrId)) continue;
        const corrEl = inner.querySelector(`[data-subject-id="${corrId}"]`) as HTMLElement | null;
        if (!corrEl) continue;
        const corrRect = corrEl.getBoundingClientRect();

        const x1 = corrRect.right - containerRect.left;
        const y1 = corrRect.top + corrRect.height / 2 - containerRect.top;
        const x2 = subjRect.left - containerRect.left;
        const y2 = subjRect.top + subjRect.height / 2 - containerRect.top;
        const dx = Math.abs(x2 - x1) * 0.4;

        result.push({
          d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
          fromId: corrId,
          toId: subject.id,
        });
      }
    }

    setMobileLines(result);
    setSvgDims({ w: inner.scrollWidth, h: inner.scrollHeight });
  }, [currentYearSubjects]);

  const recalcDesk = useCallback(() => {
    const inner = deskInnerRef.current;
    if (!inner) { setDeskLines([]); return; }
    if (!focusedId) { setDeskLines([]); return; }
    const containerRect = inner.getBoundingClientRect();
    const result: LineData[] = [];
    const focused = activeSubjects.find(s => s.id === focusedId);
    if (!focused) { setDeskLines([]); return; }

    const emitLine = (fromId: string, toId: string) => {
      const fromEl = inner.querySelector(`[data-subject-id="${fromId}"]`) as HTMLElement | null;
      const toEl = inner.querySelector(`[data-subject-id="${toId}"]`) as HTMLElement | null;
      if (!fromEl || !toEl) return;
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const x1 = fromRect.right - containerRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
      const x2 = toRect.left - containerRect.left;
      const y2 = toRect.top + toRect.height / 2 - containerRect.top;
      const dx = Math.abs(x2 - x1) * 0.4;
      result.push({ d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`, fromId, toId });
    };

    const prevYear = focused.year ? focused.year - 1 : null;
    const nextYear = focused.year ? focused.year + 1 : null;

    for (const corrId of focused.correlatividades ?? []) {
      const c = activeSubjects.find(s => s.id === corrId);
      if (c && (prevYear === null || !c.year || c.year === prevYear)) {
        emitLine(corrId, focusedId);
      }
    }
    for (const s of activeSubjects) {
      if (s.correlatividades?.includes(focusedId) && (nextYear === null || s.year === nextYear)) {
        emitLine(focusedId, s.id);
      }
    }

    setDeskLines(result);
    setDeskSvgDims({ w: inner.scrollWidth, h: inner.scrollHeight });
  }, [activeSubjects, focusedId]);

  useEffect(() => {
    recalcMobile();
    const ro = new ResizeObserver(recalcMobile);
    if (mobileContainerRef.current) ro.observe(mobileContainerRef.current);
    mobileContainerRef.current?.addEventListener("scroll", recalcMobile);
    window.addEventListener("resize", recalcMobile);
    return () => {
      ro.disconnect();
      mobileContainerRef.current?.removeEventListener("scroll", recalcMobile);
      window.removeEventListener("resize", recalcMobile);
    };
  }, [recalcMobile]);

  useEffect(() => {
    recalcDesk();
    const ro = new ResizeObserver(recalcDesk);
    if (deskContainerRef.current) ro.observe(deskContainerRef.current);
    deskContainerRef.current?.addEventListener("scroll", recalcDesk);
    window.addEventListener("resize", recalcDesk);
    return () => {
      ro.disconnect();
      deskContainerRef.current?.removeEventListener("scroll", recalcDesk);
      window.removeEventListener("resize", recalcDesk);
    };
  }, [recalcDesk]);

  if (!hasYearData || activeSubjects.length === 0) {
    const selectedPlan = PLAN_TEMPLATES.find(p => p.key === planKey);
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 px-4 overflow-y-auto pb-12">
        {!selectedPlan ? (
          <>
            <div className="w-16 h-16 rounded-3xl bg-[var(--c-glass)] border flex items-center justify-center" style={{ borderColor: "var(--c-border)" }}>
              <GraduationCap size={28} className="opacity-40" />
            </div>
            <p className="text-base font-bold text-center" style={{ color: "var(--c-text)" }}>
              Elegí tu carrera
            </p>
            <p className="text-xs max-w-[280px] text-center" style={{ color: "var(--c-text-muted)" }}>
              Seleccioná un plan de estudio para cargar automáticamente todas las materias con sus correlativas.
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-sm">
              {PLAN_TEMPLATES.map(pt => (
                <button key={pt.key} type="button"
                  onClick={() => {
                    const hasExisting = subjects.some(s => subjectExists(pt.subjects, s));
                    if (subjects.length > 0 || hasExisting) {
                      setPendingPlan({ key: pt.key, label: pt.label, subjects: pt.subjects as Subject[] });
                    } else {
                      setPlanKey(pt.key);
                      setSubjects(pt.subjects as Subject[]);
                    }
                  }}
                  className="w-full rounded-2xl border-2 px-5 py-4 text-left transition-all hover:border-violet-500/40"
                  style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{pt.label}</p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                    {pt.subjects.length} materias · {new Set(pt.subjects.map(s => s.year)).size} años
                  </p>
                </button>
              ))}
            </div>
            {/* dialog */}
            {pendingPlan && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="rounded-2xl border p-5 w-full max-w-sm shadow-2xl anim-fade-in" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Cargar plan</p>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
                    Ya tenés materias guardadas. ¿Querés reemplazarlas por las del plan "{pendingPlan.label}" o solo agregar las que faltan?
                  </p>
                  <div className="flex flex-col gap-2 mt-4">
                    <button type="button" onClick={() => {
                      setPlanKey(pendingPlan.key);
                      setSubjects(pendingPlan.subjects);
                      setPendingPlan(null);
                    }}
                      className="w-full rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
                      style={{ background: "var(--c-text)", color: "var(--c-bg)" }}>
                      Reemplazar todas ({pendingPlan.subjects.length} materias)
                    </button>
                    <button type="button" onClick={() => {
                      const toAdd = pendingPlan.subjects.filter(s => !subjectExists(subjects, s));
                      setPlanKey(pendingPlan.key);
                      setSubjects([...subjects, ...toAdd] as Subject[]);
                      setPendingPlan(null);
                    }}
                      className="w-full rounded-xl py-2.5 text-sm font-bold border transition-all active:scale-95"
                      style={{ borderColor: "var(--c-border)", color: "var(--c-text)" }}>
                      Agregar faltantes ({pendingPlan.subjects.filter(s => !subjectExists(subjects, s)).length} nuevas)
                    </button>
                    <button type="button" onClick={() => setPendingPlan(null)}
                      className="w-full rounded-xl py-2 text-xs font-semibold transition-all active:scale-95"
                      style={{ color: "var(--c-text-muted)" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 w-full max-w-sm">
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
              <span className="text-[11px] font-medium" style={{ color: "var(--c-text-muted)" }}>o</span>
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
            </div>
            <button type="button" onClick={() => router.push("/materias")}
              className="rounded-xl px-4 py-2 text-sm font-bold"
              style={{ background: "var(--c-glass)", color: "var(--c-text-muted)" }}>
              Cargar materias manualmente
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-3xl bg-[var(--c-glass)] border flex items-center justify-center" style={{ borderColor: "var(--c-border)" }}>
              <GraduationCap size={28} className="opacity-40" />
            </div>
            <p className="text-base font-bold text-center" style={{ color: "var(--c-text)" }}>
              {selectedPlan.label}
            </p>
            <p className="text-xs max-w-[260px] text-center" style={{ color: "var(--c-text-muted)" }}>
              Asigná años a tus materias para ver el plan completo.
            </p>
            <button type="button" onClick={() => router.push("/materias")}
              className="rounded-xl px-4 py-2 text-sm font-bold"
              style={{ background: "var(--c-text)", color: "var(--c-bg)" }}>
              Ir a Materias
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Mobile ── */}
      <div className="sm:hidden flex flex-col flex-1 overflow-hidden">
        <div className="flex-none px-4 overflow-x-auto scroll-x pb-1" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-1.5">
            {sortedGroups.map(([year]) => (
              <button key={year ?? "sin-ano"} type="button" onClick={() => { setFocusedId(null); setSelectedYear(year); }}
                className={`flex-none rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                  selectedYear === year ? "bg-violet-500/15 border-violet-500/30 text-violet-400" : "border-[var(--c-border)]"
                }`}
                style={selectedYear !== year ? { color: "var(--c-text-muted)", background: "var(--c-glass)" } : {}}>
                {year ? `${year}° año` : "Sin año"}
              </button>
            ))}
          </div>
        </div>
        <div ref={mobileContainerRef} className="flex-1 overflow-y-auto px-4 pb-24">
          <div ref={mobileInnerRef} className="relative"
            onClick={(e) => { if ((e.target as HTMLElement) === mobileInnerRef.current) setFocusedId(null); }}>
            <svg width={svgDims.w} height={svgDims.h} className="absolute top-0 left-0 pointer-events-none z-0" style={{ minWidth: "100%", minHeight: "100%" }}>
              {mobileLines.map((ld, i) => (
                <path key={i} d={ld.d} stroke="var(--c-border-2)" strokeWidth={1.5} fill="none" />
              ))}
            </svg>
            <div className="relative z-10 pt-4 pb-8 space-y-2.5">
              {currentYearSubjects.map(subject => {
                const color = getColor(subject.color ?? "violet");
                const st = getPlanStatus(subject, !unlockedIds.has(subject.id));
                const Icon = st.icon;
                const isFocused = focusedId === subject.id;
                const nextYear = subject.year ? subject.year + 1 : null;
                const dependents = activeSubjects.filter(s => s.correlatividades?.includes(subject.id) && (nextYear === null || s.year === nextYear));
                return (
                  <button key={subject.id} data-subject-id={subject.id} type="button"
                    onClick={() => setFocusedId(isFocused ? null : subject.id)}
                    onDoubleClick={() => router.push(`/materias?subjectId=${subject.id}`)}
                    className="w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-200"
                    style={{
                      background: isFocused ? `color-mix(in srgb, ${color.hex} 6%, var(--c-glass))` : "var(--c-glass)",
                      borderColor: isFocused ? `${color.hex}` : st.greenBorder ? "#34d39960" : st.unlocked ? `${color.hex}30` : "var(--c-border)",
                      boxShadow: isFocused ? `0 0 0 1px ${color.hex}40, 0 8px 24px ${color.hex}20` : st.greenBorder ? "0 0 0 1px #34d39915" : "none",
                    }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[10px] h-[10px] rounded-full shrink-0 ring-2 ring-offset-[2px]"
                        style={{
                          backgroundColor: color.hex,
                          "--tw-ring-color": isFocused ? color.hex : "transparent",
                        } as React.CSSProperties} />
                      <span className="text-sm font-bold truncate flex-1" style={{ color: isFocused ? "var(--c-text)" : st.unlocked ? "var(--c-text)" : "var(--c-text-muted)", opacity: st.unlocked ? 1 : 0.55 }}>
                        {subject.name}
                      </span>
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${st.badgeText}`}>
                        <Icon size={11} /> {st.label}
                      </span>
                    </div>
                    {subject.correlatividades && subject.correlatividades.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1">
                        {subject.correlatividades
                          .filter(cid => {
                            if (!subject.year) return true;
                            const c = activeSubjects.find(s => s.id === cid);
                            return !c || !c.year || c.year === subject.year - 1;
                          })
                          .map(cid => {
                          const c = activeSubjects.find(s => s.id === cid);
                          const cColor = getColor(c?.color ?? "violet");
                          return (
                            <span key={cid}
                              className="text-[9px] font-medium px-1.5 py-[2px] rounded flex items-center gap-1"
                              style={{ background: `${cColor.hex}12`, color: cColor.hex }}>
                              {c?.name ?? "—"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {dependents.length > 0 && (
                      <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--c-border)" }}>
                        <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--c-text-muted)" }}>Es requisito para</p>
                        <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                          {dependents.map(d => {
                            const dColor = getColor(d.color ?? "violet");
                            return (
                              <span key={d.id}
                                className="text-[9px] font-medium px-1.5 py-[2px] rounded"
                                style={{ background: `${dColor.hex}12`, color: dColor.hex }}>
                                {d.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:flex flex-col flex-1 overflow-hidden">
        <div className="flex-none flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2">
          <GitBranch size={14} className="text-violet-400 shrink-0" />
          <span className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Plan de carrera</span>
          {planKey && (
            <span className="text-[11px] font-medium" style={{ color: "var(--c-text-muted)" }}>
              · {PLAN_TEMPLATES.find(p => p.key === planKey)?.label}
            </span>
          )}
        </div>

        <div ref={deskContainerRef} className="flex-1 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div ref={deskInnerRef} className="relative" style={{ minWidth: "max-content" }}>
            <svg width={deskSvgDims.w} height={deskSvgDims.h} className="absolute top-0 left-0 pointer-events-none z-0" style={{ minWidth: "100%", minHeight: "100%" }}>
              {deskLines.map((ld, i) => (
                <path key={i} d={ld.d} stroke="var(--c-border-2)" strokeWidth={1.5} fill="none" />
              ))}
            </svg>
            <div className="relative z-10 flex pt-4 pb-8" style={{ gap: "2rem" }}>
              {sortedGroups.map(([year, subs]) => (
                <div key={year ?? "sin-ano"} className="flex flex-col relative pl-5" style={{ gap: "0.75rem" }}>
                  <div className="absolute left-[7px] top-3 bottom-0 w-px" style={{ background: "var(--c-border)" }} />
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-[15px] h-[15px] rounded-full border-2 border-violet-400 bg-[var(--c-bg)] shrink-0 relative z-10 flex items-center justify-center">
                      <div className="w-[5px] h-[5px] rounded-full bg-violet-400" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--c-text)" }}>
                      {year ? `${year}°` : "—"}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400">
                      {subs.length}
                    </span>
                  </div>
                  {subs.map(subject => {
                    const color = getColor(subject.color ?? "violet");
                    const st = getPlanStatus(subject, !unlockedIds.has(subject.id));
                    const isFocused = focusedId === subject.id;
                    const nextYear = subject.year ? subject.year + 1 : null;
                    const dependents = activeSubjects.filter(s => s.correlatividades?.includes(subject.id) && (nextYear === null || s.year === nextYear));
                    return (
                      <button key={subject.id} data-subject-id={subject.id} type="button"
                        onClick={() => setFocusedId(isFocused ? null : subject.id)}
                        onDoubleClick={() => router.push(`/materias?subjectId=${subject.id}`)}
                        className="w-[270px] rounded-xl border-2 px-3.5 py-2.5 text-left transition-all duration-200"
                        style={{
                          background: isFocused ? `color-mix(in srgb, ${color.hex} 6%, var(--c-glass))` : "var(--c-glass)",
                          borderColor: isFocused ? `${color.hex}` : st.greenBorder ? "#34d39960" : st.unlocked ? `${color.hex}30` : "var(--c-border)",
                          boxShadow: isFocused ? `0 0 0 1px ${color.hex}40, 0 8px 24px ${color.hex}20` : st.greenBorder ? "0 0 0 1px #34d39915" : "none",
                        }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-[10px] h-[10px] rounded-full shrink-0 ring-2 ring-offset-[2px]"
                            style={{
                              backgroundColor: color.hex,
                              ringColor: isFocused ? color.hex : "transparent",
                              "--tw-ring-color": isFocused ? color.hex : "transparent",
                            } as React.CSSProperties} />
                          <span className="text-sm font-bold truncate flex-1" style={{ color: isFocused ? "var(--c-text)" : st.unlocked ? "var(--c-text)" : "var(--c-text-muted)", opacity: st.unlocked ? 1 : 0.55 }}>
                            {subject.name}
                          </span>
                          <span className={`text-[10px] font-semibold ${st.badgeText}`}>{st.label}</span>
                        </div>
                        {subject.correlatividades && subject.correlatividades.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1">
                            {subject.correlatividades
                              .filter(cid => {
                                if (!subject.year) return true;
                                const c = activeSubjects.find(s => s.id === cid);
                                return !c || !c.year || c.year === subject.year - 1;
                              })
                              .map(cid => {
                              const c = activeSubjects.find(s => s.id === cid);
                              const cColor = getColor(c?.color ?? "violet");
                              return (
                                <span key={cid}
                                  className="text-[9px] font-medium px-1.5 py-[2px] rounded flex items-center gap-1"
                                  style={{ background: `${cColor.hex}12`, color: cColor.hex }}>
                                  {c?.name ?? "—"}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {dependents.length > 0 && (
                          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--c-border)" }}>
                            <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--c-text-muted)" }}>Es requisito para</p>
                            <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                              {dependents.map(d => {
                                const dColor = getColor(d.color ?? "violet");
                                return (
                                  <span key={d.id}
                                    className="text-[9px] font-medium px-1.5 py-[2px] rounded"
                                    style={{ background: `${dColor.hex}12`, color: dColor.hex }}>
                                    {d.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
