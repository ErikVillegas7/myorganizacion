"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSession } from "next-auth/react";
import { filterActive, mergeById, normalizeItems, nowIso } from "@/lib/sync-utils";
import {
  Folder as FolderIcon, FileText, Edit3,
  Clock, Trash2, Search, X, Plus, CheckCircle2,
} from "lucide-react";
import { useSound } from "@/lib/use-sound";
import { ViewHelp } from "@/components/view-help";

type FolderColor = "zinc" | "blue" | "emerald" | "violet" | "rose" | "amber";
type Folder = { id: string; name: string; parentId: string | null; color?: FolderColor; updatedAt?: string; deletedAt?: string | null };
type Note = { id: string; folderId: string | null; title: string; content: string; updatedAt?: string; pinned?: boolean; deletedAt?: string | null };

const FOLDER_COLORS: { id: FolderColor; label: string; icon: string; bg: string }[] = [
  { id: "zinc",    label: "Gris",    icon: "text-zinc-400",    bg: "bg-zinc-400" },
  { id: "blue",    label: "Azul",    icon: "text-blue-400",    bg: "bg-blue-400" },
  { id: "emerald", label: "Verde",   icon: "text-emerald-400", bg: "bg-emerald-400" },
  { id: "violet",  label: "Violeta", icon: "text-violet-400",  bg: "bg-violet-400" },
  { id: "rose",    label: "Rojo",    icon: "text-rose-400",    bg: "bg-rose-400" },
  { id: "amber",   label: "Naranja", icon: "text-amber-400",   bg: "bg-amber-400" },
];
const getIconColor = (color?: string) => FOLDER_COLORS.find((c) => c.id === color)?.icon ?? "text-zinc-400";

const initialFolders: Folder[] = [{ id: "general", name: "General", parentId: null, color: "blue" }];
const demoUpdatedAt = "2026-05-16T00:00:00.000Z";
const initialNotes: Note[] = [{
  id: "nota-bienvenida", folderId: "general",
  title: "Bienvenido", content: "Escribí acá tus ideas rápidas.",
  updatedAt: demoUpdatedAt,
}];
const NO_FOLDER = "__no_folder__";
const createId = () => crypto.randomUUID();
const formatUpdatedAt = (value?: string) => new Date(value ?? demoUpdatedAt);
type TabId = "lista" | "editor";

const sanitizeText = (text: string) => {
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
};

export default function NotasPage() {
  const [folders, setFolders] = useLocalStorageState<Folder[]>("mo_folders", initialFolders, {
    normalize: normalizeItems,
  });
  const [notes, setNotes] = useLocalStorageState<Note[]>("mo_notes", initialNotes, {
    normalize: normalizeItems,
  });
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef({ folders, notes });
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolders[0]?.id ?? NO_FOLDER);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [mobileTab, setMobileTab] = useState<TabId>("lista");
  const playSound = useSound();

  useEffect(() => {
    localSnapshot.current = { folders, notes };
  }, [folders, notes]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const loadRemote = async () => {
      try {
        const res = await fetch("/api/notes", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setRemoteReady(true);
          return;
        }
        const data = await res.json();
        const remoteNotes = normalizeItems(
          (Array.isArray(data?.notes) ? data.notes : []) as Note[],
        );
        const remoteFolders = normalizeItems(
          (Array.isArray(data?.folders) ? data.folders : []) as Folder[],
        );
        const local = {
          notes: normalizeItems(localSnapshot.current.notes),
          folders: normalizeItems(localSnapshot.current.folders),
        };
        const mergedNotes = mergeById(local.notes, remoteNotes);
        const mergedFolders = mergeById(local.folders, remoteFolders);
        const remoteEmpty = remoteNotes.length === 0 && remoteFolders.length === 0;
        const localHasData = local.notes.length > 0 || local.folders.length > 0;

        if (remoteEmpty && localHasData) {
          await fetch("/api/notes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: local.notes, folders: local.folders }),
          });
        }

        if (!cancelled) {
          setNotes(mergedNotes);
          setFolders(mergedFolders);
        }
      } catch {
        // Keep local data if remote sync fails.
      }

      if (!cancelled) setRemoteReady(true);
    };

    void loadRemote();
    return () => {
      cancelled = true;
    };
  }, [status, setNotes, setFolders]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, folders }),
      });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [status, remoteReady, notes, folders]);

  const [modalType, setModalType] = useState<"folder" | "note" | null>(
    () => typeof window !== "undefined" && window.location.hash === "#new" ? "note" : null,
  );
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<FolderColor>("blue");
  const [newNoteTitle, setNewNoteTitle] = useState("");

  useEffect(() => {
    if (window.location.hash === "#new") {
      window.history.replaceState(null, "", "/notas");
    }
  }, []);

  const activeFolders = useMemo(() => filterActive(folders), [folders]);
  const activeNotes = useMemo(() => filterActive(notes), [notes]);

  const resolvedFolderId = selectedFolderId === NO_FOLDER ? null : selectedFolderId;
  const activeFolderId =
    resolvedFolderId === null
      ? null
      : activeFolders.some((f) => f.id === resolvedFolderId) ? resolvedFolderId : activeFolders[0]?.id ?? null;

  const visibleNotes = useMemo(() => {
    const inFolder = activeNotes.filter((n) => n.folderId === activeFolderId);
    const pinned = inFolder.filter((n) => n.pinned);
    const rest = inFolder.filter((n) => !n.pinned);
    const sorted = [...pinned, ...rest];
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [activeNotes, activeFolderId, search]);

  const activeNoteId =
    selectedNoteId && activeNotes.some((n) => n.id === selectedNoteId)
      ? selectedNoteId : visibleNotes[0]?.id ?? null;
  const selectedNote = activeNoteId ? activeNotes.find((n) => n.id === activeNoteId) ?? null : null;

  const noteCountForFolder = (folderId: string | null) =>
    activeNotes.filter((n) => n.folderId === folderId).length;

  const handleAddFolder = () => {
    const t = newFolderName.trim();
    if (!t) return;
    playSound("success");
    const now = nowIso();
    setFolders([
      ...folders,
      { id: createId(), name: t, parentId: activeFolderId, color: newFolderColor, updatedAt: now, deletedAt: null },
    ]);
    setNewFolderName("");
    setNewFolderColor("blue");
    setModalType(null);
  };

  const handleAddNote = () => {
    const t = sanitizeText(newNoteTitle.trim());
    if (!t) return;
    playSound("success");
    const n: Note = { id: createId(), folderId: activeFolderId, title: t, content: "", updatedAt: nowIso(), deletedAt: null };
    setNotes([n, ...notes]);
    setSelectedNoteId(n.id);
    setNewNoteTitle("");
    setModalType(null);
    setMobileTab("editor");
  };

  const updateNote = (id: string, changes: Partial<Note>) => {
    const now = nowIso();
    const cleanChanges = { ...changes };
    if (cleanChanges.title !== undefined) cleanChanges.title = sanitizeText(cleanChanges.title);
    if (cleanChanges.content !== undefined) cleanChanges.content = sanitizeText(cleanChanges.content);

    setNotes(notes.map((n) => n.id === id ? { ...n, ...cleanChanges, updatedAt: cleanChanges.updatedAt ?? now } : n));
  };

  const handleRemoveNote = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar esta nota?")) return;
    playSound("pop");
    const now = nowIso();
    setNotes(notes.map((n) => n.id === id ? { ...n, deletedAt: now, updatedAt: now } : n));
    if (selectedNoteId === id) { setSelectedNoteId(null); setMobileTab("lista"); }
  };

  const togglePin = (id: string) => {
    playSound("tap");
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    updateNote(id, { pinned: !target.pinned });
  };

  // ── Folder chips (horizontal scrollable) ──
  const allFolderChips = [
    { id: NO_FOLDER, name: "Todo", color: undefined as FolderColor | undefined, count: noteCountForFolder(null) },
    ...activeFolders.filter(f => f.parentId === null).map(f => ({ id: f.id, name: f.name, color: f.color, count: noteCountForFolder(f.id) })),
  ];

  /* ─ Panel izquierdo ─ */
  const leftPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with actions */}
      <div className="flex-none px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border" style={{ borderColor: "var(--c-border)" }}>
              <FileText size={18} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-none" style={{ color: "var(--c-text)" }}>Notas</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ViewHelp title="Ayuda rápida de notas" label="Ayuda">
              <p>Organizá tus apuntes en carpetas y notas. Usá búsqueda para encontrar texto dentro de tus notas.</p>
              <p>Utilizá etiquetas para clasificar tus notas y acceder rápidamente a ellas.</p>
            </ViewHelp>
            <button type="button" onClick={() => { playSound("click"); setModalType("folder"); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border active:scale-95"
              style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)", background: "var(--c-glass)" }}>
              <FolderIcon size={12} /> Carpeta
            </button>
            <button type="button" onClick={() => { playSound("click"); setModalType("note"); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-400 transition-all active:scale-95 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Plus size={12} /> Nota
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[
            [activeFolders.length, "Carpetas", "bg-violet-500/15 text-violet-400", "bg-violet-400"],
            [activeNotes.length, "Notas", "bg-blue-500/15 text-blue-400", "bg-blue-400"],
            [activeNotes.filter(n => n.pinned).length, "Ancladas", "bg-amber-500/15 text-amber-400", "bg-amber-400"],
          ].filter(([c]) => (c as number) > 0).map(([count, label, classes, dot]) => (
            <div key={label as string} className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${classes as string}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dot as string}`} />
              {count as number} {label as string}
            </div>
          ))}
        </div>
      </div>

      {/* Folder chips — horizontal scroll */}
      <div className="flex-none px-4 py-2.5 scroll-x flex gap-1.5" style={{ borderBottom: "1px solid var(--c-border)" }}>
        {allFolderChips.map((chip) => {
          const isSelected = chip.id === selectedFolderId || (chip.id === NO_FOLDER && selectedFolderId === NO_FOLDER);
          const iconColor = chip.color ? getIconColor(chip.color) : "text-zinc-400";
          return (
            <button key={chip.id} type="button"
              onClick={() => { playSound("tap"); setSelectedFolderId(chip.id); }}
              className={`group flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap active:scale-95 ${
                isSelected
                  ? "bg-blue-500/12 border-blue-500/25 text-blue-400"
                  : "hover:bg-white/[0.04]"
              }`}
              style={!isSelected ? { borderColor: "var(--c-border)", color: "var(--c-text-muted)" } : {}}>
              {chip.id !== NO_FOLDER && <FolderIcon size={11} className={iconColor} />}
              {chip.name}
              {chip.count > 0 && <span className="opacity-60">{chip.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex-none px-4 py-2.5" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar notas…"
            className="w-full rounded-xl pl-9 pr-8 py-2 text-xs font-medium focus:outline-none transition-all"
            style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Notes list */}
      <div className="scroll-panel px-4 py-2 space-y-1.5">
        {visibleNotes.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center gap-2">
            <FileText size={24} style={{ color: "var(--c-text-muted)", opacity: 0.4 }} />
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{search ? "Sin resultados." : "Sin notas aquí."}</p>
            {!search && (
              <button
                type="button"
                onClick={() => { playSound("click"); setModalType("note"); }}
                className="mt-1 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all active:scale-95"
                style={{ background: "var(--c-text)", color: "var(--c-bg)" }}
              >
                Crear mi primera nota
              </button>
            )}
          </div>
        ) : (
          visibleNotes.map((note) => {
            const isSelected = note.id === activeNoteId;
            return (
              <button key={note.id} type="button"
                onClick={() => { playSound("tap"); setSelectedNoteId(note.id); setMobileTab("editor"); }}
                className={`w-full text-left rounded-2xl px-4 py-3.5 transition-all duration-200 relative border overflow-hidden group ${
                  isSelected ? "bg-[var(--c-glass)] border-blue-500/30 shadow-md ring-1 ring-blue-500/20" : "border-[var(--c-border)] bg-[var(--c-surface)] hover:scale-[1.01] hover:border-blue-500/20 shadow-sm"
                }`}>
                
                {/* Decoration gradient for selected note */}
                {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full pointer-events-none -mt-4 -mr-4" />}
                
                {note.pinned && (
                  <span className="absolute top-3 right-3 text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md font-bold">📌</span>
                )}
                <p className={`text-[13px] font-extrabold truncate pr-6 ${isSelected ? "text-blue-400" : ""}`} style={!isSelected ? { color: "var(--c-text)" } : {}}>{note.title}</p>
                <p className="text-[11px] line-clamp-2 mt-1.5 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
                  {note.content || "Sin contenido…"}
                </p>
                <div className="flex items-center gap-1 mt-2.5">
                  <Clock size={10} style={{ color: "var(--c-text-muted)", opacity: 0.6 }} />
                  <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-muted)", opacity: 0.6 }}>
                    {formatUpdatedAt(note.updatedAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  /* ─ Panel editor ─ */
  const rightPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Editor toolbar */}
      <div className="flex-none px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <button type="button" onClick={() => { playSound("tap"); setMobileTab("lista"); }}
          className="sm:hidden flex-none px-2 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
          ← Volver
        </button>
        <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 flex-1" style={{ color: "var(--c-text-muted)" }}>
          <Edit3 size={11} /> Editor
        </p>
        {selectedNote && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => togglePin(selectedNote.id)}
              className={`text-xs rounded-lg px-2 py-1.5 transition-all ${selectedNote.pinned ? "text-amber-500 bg-amber-500/10 border border-amber-500/20" : ""}`}
              style={!selectedNote.pinned ? { color: "var(--c-text-muted)" } : {}}
              title={selectedNote.pinned ? "Desanclar" : "Anclar"}>
              📌
            </button>
            <select
              value={selectedNote.folderId ?? ""}
              onChange={(e) => { playSound("tap"); updateNote(selectedNote.id, { folderId: e.target.value || null }); }}
              className="text-[11px] font-semibold rounded-lg px-2 py-1.5 focus:outline-none transition-all appearance-none"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
              title="Mover a carpeta"
            >
              <option value="">Sin carpeta</option>
              {activeFolders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <button type="button" onClick={() => handleRemoveNote(selectedNote.id)}
              className="flex items-center gap-1 p-1.5 rounded-lg transition-all hover:text-rose-400 hover:bg-rose-500/10"
              style={{ color: "var(--c-text-muted)" }}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {selectedNote ? (
        <div className="flex-1 flex flex-col overflow-hidden px-5 lg:px-8 py-4 gap-3 max-w-5xl w-full mx-auto">
          <input value={selectedNote.title}
            onChange={(e) => updateNote(selectedNote.id, { title: e.target.value, updatedAt: new Date().toISOString() })}
            placeholder="Título…"
            className="flex-none w-full bg-transparent text-xl sm:text-2xl font-bold focus:outline-none"
            style={{ color: "var(--c-text)" }} />

          <p className="flex-none text-[11px] font-semibold" style={{ color: "var(--c-text-muted)", opacity: 0.6 }}>
            {selectedNote.content.trim() ? selectedNote.content.trim().split(/\s+/).length : 0} palabras · {selectedNote.content.length} caracteres
          </p>

          <textarea value={selectedNote.content}
            onChange={(e) => updateNote(selectedNote.id, { content: e.target.value, updatedAt: new Date().toISOString() })}
            placeholder="Empezá a escribir acá..."
            className="scroll-panel w-full flex-1 resize-none bg-transparent text-sm sm:text-base focus:outline-none leading-relaxed"
            style={{ color: "var(--c-text)", caretColor: "var(--c-text)" }} />

          <div className="flex-none pt-2 flex items-center gap-1.5 text-[11px] font-semibold" style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text-muted)", opacity: 0.6 }}>
            <Clock size={11} />
            Editado: {formatUpdatedAt(selectedNote.updatedAt).toLocaleString("es-AR")}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
            <FileText size={24} style={{ color: "var(--c-text-muted)" }} />
          </div>
          <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Ninguna nota seleccionada</p>
          <p className="text-xs max-w-[200px]" style={{ color: "var(--c-text-muted)" }}>
            Elegí una nota o creá una nueva.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Tab bar mobile */}
      <div className="flex-none sm:hidden grid grid-cols-2" style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)" }}>
        <button type="button" onClick={() => { playSound("tap"); setMobileTab("lista"); }}
          className={`py-3 text-xs font-bold transition-all active:scale-95 ${mobileTab === "lista" ? "border-b-2 border-blue-400" : "opacity-50"}`}
          style={mobileTab === "lista" ? { color: "var(--c-text)" } : { color: "var(--c-text-muted)" }}>
          Notas
        </button>
        <button type="button" onClick={() => { playSound("tap"); setMobileTab("editor"); }}
          className={`py-3 text-xs font-bold transition-all active:scale-95 ${mobileTab === "editor" ? "border-b-2 border-emerald-400" : "opacity-50"}`}
          style={mobileTab === "editor" ? { color: "var(--c-text)" } : { color: "var(--c-text-muted)" }}>
          Editor
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden flex sm:max-w-7xl sm:mx-auto sm:w-full">
        <div className={`overflow-hidden sm:w-80 lg:w-96 sm:flex-none sm:block ${mobileTab === "lista" ? "flex-1 block" : "hidden"}`}
          style={{ borderRight: "1px solid var(--c-border)" }}>
          {leftPanel}
        </div>
        <div className={`flex-1 overflow-hidden sm:block ${mobileTab === "editor" ? "block" : "hidden sm:block"}`}>
          {rightPanel}
        </div>
      </div>

      {/* ── MODALS ── */}
      {modalType === "folder" && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setModalType(null)} />
          <div className="modal-content anim-slide-up">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Nueva Carpeta</h2>
              <button onClick={() => setModalType(null)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Nombre</label>
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Ej: Ideas de proyectos"
                  onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
                <div className="flex gap-2.5">
                  {FOLDER_COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => setNewFolderColor(c.id)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${c.bg} ${
                        newFolderColor === c.id ? "scale-110 shadow-md" : "border-transparent opacity-40 hover:opacity-80"
                      }`}
                      style={newFolderColor === c.id ? { borderColor: "var(--c-text)" } : {}} />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 pt-2">
              <button type="button" onClick={handleAddFolder}
                className="w-full rounded-xl bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/15 hover:bg-blue-400 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Crear carpeta
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === "note" && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setModalType(null)} />
          <div className="modal-content anim-slide-up">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Nueva Nota</h2>
              <button onClick={() => setModalType(null)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-muted)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--c-text-muted)" }}>Título</label>
                <input value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} placeholder="Ej: Lista de compras"
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>
              <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
                Se guardará en: <strong>{activeFolders.find(f => f.id === activeFolderId)?.name ?? "Sin carpeta"}</strong>
              </p>
            </div>
            <div className="px-5 pb-5 pt-2">
              <button type="button" onClick={handleAddNote}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Crear nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
