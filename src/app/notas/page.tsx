"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSession } from "next-auth/react";
import { filterActive, mergeById, normalizeItems, nowIso } from "@/lib/sync-utils";
import {
  FileText, Plus, Search, X, Pin, Trash2,
  Folder as FolderIcon, ChevronLeft, MoreHorizontal,
} from "lucide-react";
import { useSound } from "@/lib/use-sound";

type Folder = { id: string; name: string; parentId: string | null; updatedAt?: string; deletedAt?: string | null };
type Note = { id: string; folderId: string | null; title: string; content: string; updatedAt?: string; pinned?: boolean; deletedAt?: string | null };

const createId = () => crypto.randomUUID();
const NO_FOLDER = "__no_folder__";
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("es-AR", { month: "short", day: "numeric" }) : "";

export default function NotasPage() {
  const [folders, setFolders] = useLocalStorageState<Folder[]>("mo_folders", [], { normalize: normalizeItems });
  const [notes, setNotes] = useLocalStorageState<Note[]>("mo_notes", [], { normalize: normalizeItems });
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef({ folders, notes });
  const [search, setSearch] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);
  const playSound = useSound();

  const [selectedFolderId, setSelectedFolderId] = useState(NO_FOLDER);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    localSnapshot.current = { folders, notes };
  }, [folders, notes]);

  // Sync from remote on auth
  useEffect(() => {
    if (status !== "authenticated") return;
    if (sessionStorage.getItem("mo_cleared_all")) { sessionStorage.removeItem("mo_cleared_all"); setRemoteReady(true); return; }
    let cancelled = false;
    const loadRemote = async () => {
      try {
        const res = await fetch("/api/notes", { cache: "no-store" });
        if (!res.ok) { if (!cancelled) setRemoteReady(true); return; }
        const data = await res.json();
        const remoteNotes = normalizeItems((Array.isArray(data?.notes) ? data.notes : []) as Note[]);
        const remoteFolders = normalizeItems((Array.isArray(data?.folders) ? data.folders : []) as Folder[]);
        const local = { notes: normalizeItems(localSnapshot.current.notes), folders: normalizeItems(localSnapshot.current.folders) };
        const mergedNotes = mergeById(local.notes, remoteNotes);
        const mergedFolders = mergeById(local.folders, remoteFolders);
        const remoteEmpty = remoteNotes.length === 0 && remoteFolders.length === 0;
        const localHasData = local.notes.length > 0 || local.folders.length > 0;
        if (remoteEmpty && localHasData) {
          await fetch("/api/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: local.notes, folders: local.folders }) });
        }
        if (!cancelled) { setNotes(mergedNotes); setFolders(mergedFolders); }
      } catch { /* keep local */ }
      if (!cancelled) setRemoteReady(true);
    };
    void loadRemote();
    return () => { cancelled = true; };
  }, [status, setNotes, setFolders]);

  // Sync to remote on change
  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes, folders }) });
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [status, remoteReady, notes, folders]);

  const activeFolders = useMemo(() => filterActive(folders), [folders]);
  const activeNotes = useMemo(() => filterActive(notes), [notes]);

  const currentFolderObj = selectedFolderId === NO_FOLDER ? null : activeFolders.find(f => f.id === selectedFolderId);
  const notesInFolder = useMemo(() => {
    const inFolder = selectedFolderId === NO_FOLDER ? activeNotes : activeNotes.filter(n => n.folderId === selectedFolderId);
    const sorted = [...inFolder.filter(n => n.pinned), ...inFolder.filter(n => !n.pinned)];
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [activeNotes, selectedFolderId, search]);

  const selectedNote = useMemo(() => selectedNoteId ? activeNotes.find(n => n.id === selectedNoteId) ?? null : null, [activeNotes, selectedNoteId]);

  const updateNote = (id: string, changes: Partial<Note>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...changes, updatedAt: changes.updatedAt ?? nowIso() } : n));
  };

  const createNote = () => {
    playSound("success");
    const n: Note = { id: createId(), folderId: selectedFolderId === NO_FOLDER ? null : selectedFolderId, title: "Nueva nota", content: "", updatedAt: nowIso(), deletedAt: null };
    setNotes([n, ...notes]);
    setSelectedNoteId(n.id);
  };

  const deleteNote = (id: string) => {
    if (!window.confirm("¿Eliminar esta nota?")) return;
    playSound("pop");
    setNotes(notes.map(n => n.id === id ? { ...n, deletedAt: nowIso(), updatedAt: nowIso() } : n));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const togglePin = (id: string) => {
    playSound("tap");
    const target = notes.find(n => n.id === id);
    if (target) updateNote(id, { pinned: !target.pinned });
  };

  const createFolder = () => {
    const t = newFolderName.trim();
    if (!t) return;
    playSound("success");
    setFolders([...folders, { id: createId(), name: t, parentId: null, updatedAt: nowIso(), deletedAt: null }]);
    setNewFolderName("");
    setShowNewFolder(false);
  };

  // ── Folder sidebar ──
  const folderList = (
    <div className="flex flex-col h-full">
      <div className="flex-none px-3 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Carpetas</h2>
        <button type="button" onClick={() => { playSound("click"); setShowNewFolder(true); }}
          className="p-1 rounded-md transition-all hover:bg-white/[0.05]"
          style={{ color: "var(--c-text-muted)" }}>
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
        <button type="button" onClick={() => { playSound("tap"); setSelectedFolderId(NO_FOLDER); setSelectedNoteId(null); }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
            selectedFolderId === NO_FOLDER ? "bg-blue-500/12 text-blue-400" : "hover:bg-white/[0.04]"
          }`} style={selectedFolderId !== NO_FOLDER ? { color: "var(--c-text)" } : {}}>
          <FileText size={14} />
          Todas las notas
          <span className="ml-auto opacity-50">{activeNotes.length}</span>
        </button>
        {activeFolders.map(f => (
          <button key={f.id} type="button" onClick={() => { playSound("tap"); setSelectedFolderId(f.id); setSelectedNoteId(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
              selectedFolderId === f.id ? "bg-blue-500/12 text-blue-400" : "hover:bg-white/[0.04]"
            }`} style={selectedFolderId !== f.id ? { color: "var(--c-text)" } : {}}>
            <FolderIcon size={14} />
            <span className="truncate">{f.name}</span>
            <span className="ml-auto opacity-50">{activeNotes.filter(n => n.folderId === f.id).length}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Note list ──
  const noteList = (
    <div className="flex flex-col h-full">
      <div className="flex-none px-3 py-3 space-y-2" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" onClick={() => setFolderOpen(true)}
              className="sm:hidden p-1 rounded-md transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
              <FolderIcon size={16} />
            </button>
            <h1 className="text-sm font-extrabold truncate" style={{ color: "var(--c-text)" }}>
              {currentFolderObj?.name ?? "Todas las notas"}
            </h1>
          </div>
          <button type="button" onClick={createNote}
            className="flex-none flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-400 transition-all active:scale-95 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
            <Plus size={12} /> Nueva
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
            className="w-full rounded-lg pl-8 pr-7 py-1.5 text-xs font-medium focus:outline-none transition-all"
            style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notesInFolder.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-center px-4">
            <FileText size={22} style={{ color: "var(--c-text-muted)", opacity: 0.3 }} />
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{search ? "Sin resultados" : "No hay notas"}</p>
            {!search && (
              <button type="button" onClick={createNote}
                className="mt-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95"
                style={{ background: "var(--c-text)", color: "var(--c-bg)" }}>
                Crear nota
              </button>
            )}
          </div>
        ) : (
          <div className="px-2 py-2 space-y-1">
            {notesInFolder.map(note => (
              <button key={note.id} type="button" onClick={() => { playSound("tap"); setSelectedNoteId(note.id); }}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition-all border ${
                  note.id === selectedNoteId ? "border-blue-500/30 bg-blue-500/8" : "border-transparent hover:bg-white/[0.03]"
                }`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {note.pinned && <Pin size={10} className="text-amber-500 shrink-0" />}
                      <p className="text-[13px] font-bold truncate" style={{ color: "var(--c-text)" }}>{note.title}</p>
                    </div>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                      {note.content || "Sin contenido"}
                    </p>
                    <p className="text-[9px] mt-1 font-medium uppercase tracking-wider" style={{ color: "var(--c-text-muted)", opacity: 0.5 }}>
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Editor ──
  const editorView = selectedNote ? (
    <div className="flex flex-col h-full">
      <div className="flex-none flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <button type="button" onClick={() => setSelectedNoteId(null)}
          className="sm:hidden flex-none p-1 rounded-md transition-all hover:bg-white/[0.05]" style={{ color: "var(--c-text-muted)" }}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1" />
        <button type="button" onClick={() => togglePin(selectedNote.id)}
          className={`p-1.5 rounded-md transition-all ${selectedNote.pinned ? "text-amber-500 bg-amber-500/10" : "hover:bg-white/[0.05]"}`}
          style={!selectedNote.pinned ? { color: "var(--c-text-muted)" } : {}}>
          <Pin size={14} />
        </button>
        <select value={selectedNote.folderId ?? ""} onChange={e => { playSound("tap"); updateNote(selectedNote.id, { folderId: e.target.value || null }); }}
          className="text-[11px] font-semibold rounded-md px-2 py-1.5 focus:outline-none appearance-none"
          style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}>
          <option value="">Sin carpeta</option>
          {activeFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button type="button" onClick={() => deleteNote(selectedNote.id)}
          className="p-1.5 rounded-md transition-all hover:text-rose-400 hover:bg-rose-500/10" style={{ color: "var(--c-text-muted)" }}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-6 py-4 gap-3 max-w-3xl w-full mx-auto">
        <input value={selectedNote.title} onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
          placeholder="Título" className="w-full bg-transparent text-xl sm:text-2xl font-bold focus:outline-none"
          style={{ color: "var(--c-text)" }} />
        <textarea value={selectedNote.content} onChange={e => updateNote(selectedNote.id, { content: e.target.value })}
          placeholder="Empezá a escribir…" className="w-full flex-1 resize-none bg-transparent text-sm sm:text-base focus:outline-none leading-relaxed scroll-panel"
          style={{ color: "var(--c-text)" }} />
      </div>
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
        <FileText size={20} style={{ color: "var(--c-text-muted)" }} />
      </div>
      <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Elegí una nota</p>
      <p className="text-xs max-w-[180px] text-center" style={{ color: "var(--c-text-muted)" }}>O creá una nueva desde el botón <strong>Nueva</strong></p>
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden">
      {/* Folder sidebar - desktop */}
      <div className="hidden sm:flex sm:flex-none w-52 lg:w-56 flex-col" style={{ borderRight: "1px solid var(--c-border)" }}>
        {folderList}
      </div>

      {/* Note list */}
      <div className={`flex-1 sm:max-w-sm flex flex-col ${selectedNoteId ? "hidden sm:flex" : "flex"}`}
        style={{ borderRight: selectedNoteId ? "none" : "1px solid var(--c-border)" }}>
        {noteList}
      </div>

      {/* Editor */}
      <div className={`flex-1 flex flex-col ${selectedNoteId ? "flex" : "hidden sm:flex"}`}>
        {editorView}
      </div>

      {/* Folder sidebar - mobile overlay */}
      {folderOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/50" onClick={() => setFolderOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64" style={{ background: "var(--c-bg)", borderRight: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <div />
              <button type="button" onClick={() => setFolderOpen(false)} className="p-1 rounded-md" style={{ color: "var(--c-text-muted)" }}>
                <X size={16} />
              </button>
            </div>
            {folderList}
          </div>
        </div>
      )}

      {/* New folder dialog */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/50" onClick={() => setShowNewFolder(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-5 border shadow-xl" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--c-text)" }}>Nueva carpeta</h3>
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nombre"
              onKeyDown={e => e.key === "Enter" && createFolder()}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none mb-3"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNewFolder(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all" style={{ color: "var(--c-text-muted)", background: "var(--c-glass)" }}>
                Cancelar
              </button>
              <button type="button" onClick={createFolder}
                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/15 hover:bg-blue-400 transition-all">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
