"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useSettings, AppTheme } from "@/lib/use-settings";
import { useLocalStorageState } from "@/lib/use-local-storage";
import {
  User, Sun, Moon, Download, Upload, Trash2,
  Camera, Settings, CheckCircle2, AlertTriangle, Volume2, VolumeX, GraduationCap,
} from "lucide-react";
import { useSound } from "@/lib/use-sound";
import { APP_STORAGE_KEYS } from "@/lib/logout-sync";
import { STORAGE_KEYS } from "@/lib/materias/constants";
import { PLAN_TEMPLATES, PLAN_STORAGE_KEY } from "@/lib/materias/plan-templates";
import type { Subject } from "@/types/materias";

function normalizeName(n: string) {
  return n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function subjectExists(existing: Subject[], s: Subject) {
  const norm = normalizeName(s.name);
  return existing.some(e => e.id === s.id || (norm && normalizeName(e.name) === norm));
}

const ALL_STORAGE_KEYS: string[] = [...APP_STORAGE_KEYS];

function exportBackup() {
  const data: Record<string, unknown> = {};
  for (const key of ALL_STORAGE_KEYS) {
    const val = localStorage.getItem(key);
    if (val) data[key] = JSON.parse(val);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mi-organizacion-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file: File, onDone: () => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as Record<string, unknown>;
      for (const [key, val] of Object.entries(data)) {
        if (ALL_STORAGE_KEYS.includes(key)) {
          localStorage.setItem(key, JSON.stringify(val));
        }
      }
      onDone();
      window.location.reload();
    } catch {
      alert("Archivo de backup inválido.");
    }
  };
  reader.readAsText(file);
}

export default function AjustesPage() {
  const [settings, setSettings] = useSettings();
  const [name, setName] = useState(settings.name);
  const [saved, setSaved] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [subjects, setSubjects] = useLocalStorageState<Subject[]>(STORAGE_KEYS.subjects, [], { normalize: (v: unknown) => v as Subject[] });
  const [planKey, setPlanKey] = useLocalStorageState<string | null>(PLAN_STORAGE_KEY, null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const playSound = useSound();

  const handleSaveName = () => {
    playSound("success");
    setSettings({ ...settings, name: name.trim() || "Estudiante" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSettings({ ...settings, avatar: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleTheme = (t: AppTheme) => {
    playSound("tap");
    setSettings({ ...settings, theme: t });
    document.documentElement.setAttribute("data-theme", t);
  };

  const handleClearAll = () => {
    for (const key of ALL_STORAGE_KEYS) localStorage.removeItem(key);
    window.location.reload();
  };

  return (
    <div className="h-full overflow-y-auto scroll-panel">
      <div className="p-5 sm:p-8 max-w-xl lg:max-w-3xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-3 pt-1 anim-slide-down">
          <div className="p-2.5 rounded-2xl border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <Settings size={18} style={{ color: "var(--c-text-muted)" }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)" }}>Ajustes</h1>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Personalizá tu experiencia</p>
          </div>
        </div>

        {/* ── Perfil ── */}
        <section className="rounded-2xl p-5 border flex flex-col gap-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--c-text-muted)" }}>
            <User size={12} /> Perfil
          </h2>

          <div className="flex items-center gap-4">
            <div className="relative flex-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center border-2" style={{ background: "var(--c-glass)", borderColor: "var(--c-border-2)" }}>
                {settings.avatar ? (
                  <Image src={settings.avatar} alt="avatar" width={80} height={80} unoptimized className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--c-text-muted)" }}>
                    {(settings.name?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => { playSound("tap"); avatarInputRef.current?.click(); }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg hover:bg-violet-400 transition-all active:scale-90">
                <Camera size={13} className="text-white" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nombre</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="flex-1 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
                <button type="button" onClick={handleSaveName}
                  className={`flex-none rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${saved ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-[var(--c-text)] text-[var(--c-bg)] shadow-md"}`}>
                  {saved ? <><CheckCircle2 size={13} /> Guardado</> : "Guardar"}
                </button>
              </div>
              {settings.avatar && (
                <button type="button" onClick={() => { playSound("pop"); setSettings({ ...settings, avatar: undefined }); }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 mt-2 transition-all active:scale-95">
                  Eliminar foto
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Experiencia — segmented control ── */}
        <section className="rounded-2xl p-5 border flex flex-col gap-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", animationDelay: "0.05s" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--c-text-muted)" }}>
            <Sun size={12} /> Experiencia
          </h2>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Apariencia</span>
            <div className="segmented-control" style={{ maxWidth: "200px" }}>
              <button type="button" data-active={settings.theme === "dark"} onClick={() => handleTheme("dark")}
                className="flex items-center justify-center gap-2">
                <Moon size={14} /> Oscuro
              </button>
              <button type="button" data-active={settings.theme === "light"} onClick={() => handleTheme("light")}
                className="flex items-center justify-center gap-2">
                <Sun size={14} /> Claro
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--c-border)" }}>
            <div>
              <span className="text-sm font-bold block" style={{ color: "var(--c-text)" }}>Sonidos</span>
              <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>Efectos al tocar botones</span>
            </div>
            <div className="segmented-control" style={{ maxWidth: "160px" }}>
              <button type="button" data-active={settings.soundEnabled === true} onClick={() => { setSettings({ ...settings, soundEnabled: true }); playSound("success"); }}
                className="flex items-center justify-center gap-2">
                <Volume2 size={14} /> Sí
              </button>
              <button type="button" data-active={settings.soundEnabled !== true} onClick={() => setSettings({ ...settings, soundEnabled: false })}
                className="flex items-center justify-center gap-2">
                <VolumeX size={14} /> No
              </button>
            </div>
          </div>

        </section>

        {/* ── Plan de carrera ── */}
        <section className="rounded-2xl p-5 border flex flex-col gap-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", animationDelay: "0.1s" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--c-text-muted)" }}>
            <GraduationCap size={12} /> Plan de carrera
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            {planKey
              ? `Plan activo: ${PLAN_TEMPLATES.find(p => p.key === planKey)?.label ?? planKey}`
              : "Elegí un plan de estudio para cargar todas las materias automáticamente."}
          </p>
          {PLAN_TEMPLATES.map(pt => {
            const active = planKey === pt.key;
            return (
              <button key={pt.key} type="button"
                onClick={() => {
                  if (active) {
                    if (confirm(`Desactivar plan "${pt.label}"? Las materias del plan no se eliminarán.`)) {
                      setPlanKey(null);
                    }
                    return;
                  }
                  const toAdd = pt.subjects.filter(s => !subjectExists(subjects, s));
                  if (toAdd.length === 0) {
                    setPlanKey(pt.key);
                    return;
                  }
                  if (confirm(`Se agregarán ${toAdd.length} materias nuevas del plan "${pt.label}". Las materias que ya tenés no se modifican. ¿Continuar?`)) {
                    setPlanKey(pt.key);
                    setSubjects([...subjects, ...toAdd] as Subject[]);
                  }
                }}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${active ? "border-violet-500/40" : ""}`}
                style={{ background: active ? "var(--c-glass)" : "var(--c-glass)", borderColor: active ? "#a78bfa66" : "var(--c-border)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: active ? "var(--c-text)" : "var(--c-text)" }}>{pt.label}</p>
                  {active && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-400">Activo</span>}
                </div>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                  {pt.subjects.length} materias · {new Set(pt.subjects.map(s => s.year)).size} años
                </p>
              </button>
            );
          })}
        </section>

        {/* ── Backup ── */}
        <section className="rounded-2xl p-5 border flex flex-col gap-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", animationDelay: "0.15s" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--c-text-muted)" }}>
            <Download size={12} /> Datos y backup
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            Si iniciás sesión con Google, tus datos se sincronizan. También podés exportar un backup local para usarlo en otro dispositivo.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { playSound("click"); exportBackup(); }}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 border text-sm font-bold transition-all hover:scale-[1.01] active:scale-95"
              style={{ borderColor: "var(--c-border)", background: "var(--c-glass)", color: "var(--c-text)" }}>
              <Download size={15} /> Exportar
            </button>
            <button type="button" onClick={() => { playSound("tap"); backupInputRef.current?.click(); }}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 border text-sm font-bold transition-all hover:scale-[1.01] active:scale-95"
              style={{ borderColor: "var(--c-border)", background: "var(--c-glass)", color: "var(--c-text)" }}>
              <Upload size={15} /> Importar
            </button>
            <input ref={backupInputRef} type="file" accept=".json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f, () => {}); }} />
          </div>
        </section>

        {/* ── Zona peligrosa ── */}
        <section className="rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5 flex flex-col gap-3 anim-slide-up" style={{           animationDelay: "0.2s" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
            <AlertTriangle size={12} /> Zona peligrosa
          </h2>
          {!showDanger ? (
            <button type="button" onClick={() => { playSound("pop"); setShowDanger(true); }}
              className="flex items-center gap-2 rounded-xl py-2.5 px-4 border border-rose-500/25 bg-rose-500/10 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all w-full justify-center active:scale-95">
              <Trash2 size={15} /> Borrar todos los datos
            </button>
          ) : (
            <div className="flex flex-col gap-3 anim-fade-in">
              <p className="text-sm text-rose-300 font-medium">¿Seguro? Esto borra <strong>todo</strong> — notas, hábitos, materias, eventos. No se puede deshacer.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={() => { playSound("tap"); setShowDanger(false); }}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                  style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
                  Cancelar
                </button>
                <button type="button" onClick={() => { playSound("click"); handleClearAll(); }}
                  className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-400 transition-all active:scale-95 shadow-md">
                  Sí, borrar todo
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <p className="text-center text-[11px] pb-4" style={{ color: "var(--c-text-muted)" }}>
          Desarrollado por Villegas · Datos guardados localmente
        </p>
      </div>
    </div>
  );
}
