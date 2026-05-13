"use client";

import { useRef, useState } from "react";
import { useSettings, AppTheme } from "@/lib/use-settings";
import {
  User, Sun, Moon, Download, Upload, Trash2,
  Camera, Settings, CheckCircle2, AlertTriangle,
} from "lucide-react";

const ALL_STORAGE_KEYS = [
  "mo_notes", "mo_folders", "mo_events", "mo_habits",
  "mo_subjects", "mo_units", "mo_settings",
];

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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
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
    setSettings({ ...settings, theme: t });
    document.documentElement.setAttribute("data-theme", t);
  };

  const handleClearAll = () => {
    for (const key of ALL_STORAGE_KEYS) localStorage.removeItem(key);
    window.location.reload();
  };

  return (
    <div className="h-full overflow-y-auto scroll-panel">
      <div className="p-5 sm:p-8 max-w-xl mx-auto flex flex-col gap-5">

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
                  <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--c-text-muted)" }}>
                    {(settings.name?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg hover:bg-violet-400 transition-all">
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
                  className={`flex-none rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${saved ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-violet-500 text-white hover:bg-violet-400"}`}>
                  {saved ? <><CheckCircle2 size={13} /> Guardado</> : "Guardar"}
                </button>
              </div>
              {settings.avatar && (
                <button type="button" onClick={() => setSettings({ ...settings, avatar: undefined })}
                  className="text-[11px] text-rose-400 hover:text-rose-300 mt-2 transition-all">
                  Eliminar foto
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Tema — segmented control ── */}
        <section className="rounded-2xl p-5 border flex flex-col gap-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", animationDelay: "0.05s" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--c-text-muted)" }}>
            <Sun size={12} /> Apariencia
          </h2>
          <div className="segmented-control" style={{ maxWidth: "280px" }}>
            <button type="button" data-active={settings.theme === "dark"} onClick={() => handleTheme("dark")}
              className="flex items-center justify-center gap-2">
              <Moon size={14} /> Oscuro
            </button>
            <button type="button" data-active={settings.theme === "light"} onClick={() => handleTheme("light")}
              className="flex items-center justify-center gap-2">
              <Sun size={14} /> Claro
            </button>
          </div>
        </section>

        {/* ── Backup ── */}
        <section className="rounded-2xl p-5 border flex flex-col gap-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)", animationDelay: "0.1s" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--c-text-muted)" }}>
            <Download size={12} /> Datos y backup
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            Tus datos se guardan localmente en este navegador. Exportá un backup para usarlos en otro dispositivo.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={exportBackup}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 border text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.98]"
              style={{ borderColor: "var(--c-border)", background: "var(--c-glass)", color: "var(--c-text)" }}>
              <Download size={15} /> Exportar
            </button>
            <button type="button" onClick={() => backupInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 border text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.98]"
              style={{ borderColor: "var(--c-border)", background: "var(--c-glass)", color: "var(--c-text)" }}>
              <Upload size={15} /> Importar
            </button>
            <input ref={backupInputRef} type="file" accept=".json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f, () => {}); }} />
          </div>
        </section>

        {/* ── Zona peligrosa ── */}
        <section className="rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5 flex flex-col gap-3 anim-slide-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
            <AlertTriangle size={12} /> Zona peligrosa
          </h2>
          {!showDanger ? (
            <button type="button" onClick={() => setShowDanger(true)}
              className="flex items-center gap-2 rounded-xl py-2.5 px-4 border border-rose-500/25 bg-rose-500/10 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all w-full justify-center">
              <Trash2 size={15} /> Borrar todos los datos
            </button>
          ) : (
            <div className="flex flex-col gap-3 anim-fade-in">
              <p className="text-sm text-rose-300 font-medium">¿Seguro? Esto borra <strong>todo</strong> — notas, hábitos, materias, eventos. No se puede deshacer.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={() => setShowDanger(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                  style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
                  Cancelar
                </button>
                <button type="button" onClick={handleClearAll}
                  className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-400 transition-all">
                  Sí, borrar todo
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <p className="text-center text-[11px] pb-4" style={{ color: "var(--c-text-muted)" }}>
          Mi Organización v3.0 · Datos guardados localmente
        </p>
      </div>
    </div>
  );
}
