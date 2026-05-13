"use client";

import { useMemo, useState } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import {
  Folder as FolderIcon, FolderOpen, FileText, Edit3,
  Clock, Trash2, Search, X, ChevronRight, Plus, CheckCircle2,
} from "lucide-react";

type FolderColor = "zinc" | "blue" | "emerald" | "violet" | "rose" | "amber";
type Folder = { id: string; name: string; parentId: string | null; color?: FolderColor };
type Note = { id: string; folderId: string | null; title: string; content: string; updatedAt: string; pinned?: boolean };

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
const initialNotes: Note[] = [{
  id: "nota-bienvenida", folderId: "general",
  title: "Bienvenido", content: "Escribí acá tus ideas rápidas.",
  updatedAt: new Date().toISOString(),
}];
const NO_FOLDER = "__no_folder__";
const createId = () => crypto.randomUUID();
type TabId = "lista" | "editor";

export default function NotasPage() {
  const [folders, setFolders] = useLocalStorageState<Folder[]>("mo_folders", initialFolders);
  const [notes, setNotes] = useLocalStorageState<Note[]>("mo_notes", initialNotes);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolders[0]?.id ?? NO_FOLDER);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [mobileTab, setMobileTab] = useState<TabId>("lista");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Modals
  const [modalType, setModalType] = useState<"folder" | "note" | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<FolderColor>("blue");
  const [newNoteTitle, setNewNoteTitle] = useState("");

  const resolvedFolderId = selectedFolderId === NO_FOLDER ? null : selectedFolderId;
  const activeFolderId =
    resolvedFolderId === null
      ? null
      : folders.some((f) => f.id === resolvedFolderId) ? resolvedFolderId : folders[0]?.id ?? null;

  const visibleNotes = useMemo(() => {
    const inFolder = notes.filter((n) => n.folderId === activeFolderId);
    const pinned = inFolder.filter((n) => n.pinned);
    const rest = inFolder.filter((n) => !n.pinned);
    const sorted = [...pinned, ...rest];
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [notes, activeFolderId, search]);

  const activeNoteId =
    selectedNoteId && notes.some((n) => n.id === selectedNoteId)
      ? selectedNoteId : visibleNotes[0]?.id ?? null;
  const selectedNote = activeNoteId ? notes.find((n) => n.id === activeNoteId) ?? null : null;

  const noteCountForFolder = (folderId: string | null) =>
    notes.filter((n) => n.folderId === folderId).length;

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAddFolder = () => {
    const t = newFolderName.trim();
    if (!t) return;
    setFolders([...folders, { id: createId(), name: t, parentId: activeFolderId, color: newFolderColor }]);
    setNewFolderName("");
    setNewFolderColor("blue");
    setModalType(null);
  };

  const handleAddNote = () => {
    const t = newNoteTitle.trim();
    if (!t) return;
    const n: Note = { id: createId(), folderId: activeFolderId, title: t, content: "", updatedAt: new Date().toISOString() };
    setNotes([n, ...notes]);
    setSelectedNoteId(n.id);
    setNewNoteTitle("");
    setModalType(null);
    setMobileTab("editor");
  };

  const handleRemoveFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que querés eliminar esta carpeta? Sus notas irán a 'Sin carpeta'.")) return;
    setNotes(notes.map((n) => n.folderId === id ? { ...n, folderId: null } : n));
    const toRemove = new Set<string>();
    const collect = (fid: string) => {
      toRemove.add(fid);
      folders.filter((f) => f.parentId === fid).forEach((f) => collect(f.id));
    };
    collect(id);
    setFolders(folders.filter((f) => !toRemove.has(f.id)));
    setNotes(notes.map((n) => toRemove.has(n.folderId ?? "") ? { ...n, folderId: null } : n));
    if (selectedFolderId === id) setSelectedFolderId(NO_FOLDER);
  };

  const handleStartRename = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  };

  const handleSaveRename = (id: string) => {
    const t = renameValue.trim();
    if (t) setFolders(folders.map((f) => f.id === id ? { ...f, name: t } : f));
    setRenamingId(null);
  };

  const updateNote = (id: string, changes: Partial<Note>) =>
    setNotes(notes.map((n) => n.id === id ? { ...n, ...changes } : n));

  const handleRemoveNote = (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar esta nota?")) return;
    setNotes(notes.filter((n) => n.id !== id));
    if (selectedNoteId === id) { setSelectedNoteId(null); setMobileTab("lista"); }
  };

  const togglePin = (id: string) =>
    setNotes(notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));

  // ── Folder chips (horizontal scrollable) ──
  const allFolderChips = [
    { id: NO_FOLDER, name: "Todo", color: undefined as FolderColor | undefined, count: noteCountForFolder(null) },
    ...folders.filter(f => f.parentId === null).map(f => ({ id: f.id, name: f.name, color: f.color, count: noteCountForFolder(f.id) })),
  ];

  /* ─ Panel izquierdo ─ */
  const leftPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with actions */}
      <div className="flex-none px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Notas</p>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setModalType("folder")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border"
            style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)", background: "var(--c-glass)" }}>
            <FolderIcon size={12} /> Carpeta
          </button>
          <button type="button" onClick={() => setModalType("note")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-400 transition-all">
            <Plus size={12} /> Nota
          </button>
        </div>
      </div>

      {/* Folder chips — horizontal scroll */}
      <div className="flex-none px-4 py-2.5 scroll-x flex gap-1.5" style={{ borderBottom: "1px solid var(--c-border)" }}>
        {allFolderChips.map((chip) => {
          const isSelected = chip.id === selectedFolderId || (chip.id === NO_FOLDER && selectedFolderId === NO_FOLDER);
          const iconColor = chip.color ? getIconColor(chip.color) : "text-zinc-400";
          return (
            <button key={chip.id} type="button"
              onClick={() => setSelectedFolderId(chip.id)}
              className={`group flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
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
            <button type="button" onClick={() => setSearch("")}
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
          </div>
        ) : (
          visibleNotes.map((note) => {
            const isSelected = note.id === activeNoteId;
            return (
              <button key={note.id} type="button"
                onClick={() => { setSelectedNoteId(note.id); setMobileTab("editor"); }}
                className={`w-full text-left rounded-xl px-3.5 py-3 transition-all duration-200 relative border ${
                  isSelected ? "bg-blue-500/10 border-blue-500/25" : "border-transparent hover:bg-white/[0.03]"
                }`}>
                {note.pinned && (
                  <span className="absolute top-2.5 right-3 text-[10px]">📌</span>
                )}
                <p className="text-xs font-bold truncate pr-4" style={{ color: "var(--c-text)" }}>{note.title}</p>
                <p className="text-[11px] truncate mt-1" style={{ color: "var(--c-text-muted)" }}>
                  {note.content || "Sin contenido…"}
                </p>
                <p className="text-[10px] mt-1.5" style={{ color: "var(--c-text-muted)", opacity: 0.6 }}>
                  {new Date(note.updatedAt).toLocaleDateString("es-AR")}
                </p>
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
        <button type="button" onClick={() => setMobileTab("lista")}
          className="sm:hidden flex-none text-xs font-bold transition-all" style={{ color: "var(--c-text-muted)" }}>
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
              onChange={(e) => updateNote(selectedNote.id, { folderId: e.target.value || null })}
              className="text-[11px] font-semibold rounded-lg px-2 py-1.5 focus:outline-none transition-all appearance-none"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
              title="Mover a carpeta"
            >
              <option value="">Sin carpeta</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
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
        <div className="flex-1 flex flex-col overflow-hidden px-5 py-4 gap-3">
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
            Editado: {new Date(selectedNote.updatedAt).toLocaleString("es-AR")}
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
        <button type="button" onClick={() => setMobileTab("lista")}
          className={`py-3 text-xs font-bold transition-all ${mobileTab === "lista" ? "border-b-2 border-blue-400" : "opacity-50"}`}
          style={mobileTab === "lista" ? { color: "var(--c-text)" } : { color: "var(--c-text-muted)" }}>
          Notas
        </button>
        <button type="button" onClick={() => setMobileTab("editor")}
          className={`py-3 text-xs font-bold transition-all ${mobileTab === "editor" ? "border-b-2 border-emerald-400" : "opacity-50"}`}
          style={mobileTab === "editor" ? { color: "var(--c-text)" } : { color: "var(--c-text-muted)" }}>
          Editor
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden flex">
        <div className={`overflow-hidden sm:w-80 sm:flex-none sm:block ${mobileTab === "lista" ? "flex-1 block" : "hidden"}`}
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
                <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Ej: Ideas de proyectos"
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
                        newFolderColor === c.id ? "border-white scale-110 shadow-md" : "border-transparent opacity-40 hover:opacity-80"
                      }`} />
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
                <input autoFocus value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} placeholder="Ej: Lista de compras"
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all"
                  style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
              </div>
              <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
                Se guardará en: <strong>{folders.find(f => f.id === activeFolderId)?.name ?? "Sin carpeta"}</strong>
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
