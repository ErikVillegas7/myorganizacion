"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, Calendar, BookOpen,
  Activity, Menu, X, Settings, Plus, Cloud,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSettings } from "@/lib/use-settings";
import { useSound } from "@/lib/use-sound";
import { filterActive } from "@/lib/sync-utils";
import { clearLocalAppData, syncLocalDataBeforeLogout } from "@/lib/logout-sync";

type AppShellProps = { children: React.ReactNode };

/* 5 items — Ajustes se accede desde el avatar */
const navItems = [
  { href: "/",           label: "Inicio",     icon: LayoutDashboard, color: "text-emerald-400", activeBg: "bg-emerald-500/12", activeBorder: "border-emerald-500/25" },
  { href: "/notas",      label: "Notas",      icon: FileText,        color: "text-blue-400",    activeBg: "bg-blue-500/12",    activeBorder: "border-blue-500/25" },
  { href: "/calendario", label: "Calendario", icon: Calendar,        color: "text-rose-400",    activeBg: "bg-rose-500/12",    activeBorder: "border-rose-500/25" },
  { href: "/materias",   label: "Materias",   icon: BookOpen,        color: "text-violet-400",  activeBg: "bg-violet-500/12",  activeBorder: "border-violet-500/25" },
  { href: "/habitos",    label: "Hábitos",    icon: Activity,        color: "text-amber-400",   activeBg: "bg-amber-500/12",   activeBorder: "border-amber-500/25" },
];

type CalEvent = { id: string; date: string; deletedAt?: string | null };

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [events] = useLocalStorageState<CalEvent[]>("mo_events", []);
  const [settings] = useSettings();
  const { data: session, status } = useSession();
  const playSound = useSound();

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storageKeys = [
        "mo_notes",
        "mo_folders",
        "mo_events",
        "mo_habits",
        "mo_subjects",
        "mo_units",
        "mo_settings",
      ];
      const hasData = storageKeys.some((key) => {
        const raw = window.localStorage.getItem(key);
        if (!raw) return false;
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed)
            ? parsed.length > 0
            : parsed && typeof parsed === "object" && Object.keys(parsed).length > 0;
        } catch {
          return true;
        }
      });
      setHasLocalData(hasData);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [events, settings]);

  const isAjustes = pathname.startsWith("/ajustes");

  const activeEvents = useMemo(() => filterActive(events), [events]);

  const upcomingBadge = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in7 = new Date(today); in7.setDate(today.getDate() + 7);
    return activeEvents.filter((e) => {
      const d = new Date(`${e.date}T00:00:00`);
      return d >= today && d <= in7;
    }).length;
  }, [activeEvents]);

  const displayName = session?.user?.name ?? settings.name;
  const avatarEl = session?.user?.image ? (
    <Image src={session.user.image} alt="avatar" width={28} height={28} unoptimized className="w-full h-full object-cover" />
  ) : settings.avatar ? (
    <Image src={settings.avatar} alt="avatar" width={28} height={28} unoptimized className="w-full h-full object-cover" />
  ) : (
    <span className="text-[11px] font-bold" style={{ color: "var(--c-text)" }}>
      {(displayName?.[0] ?? "U").toUpperCase()}
    </span>
  );

  const handleSafeSignOut = async () => {
    if (isSigningOut) return;
    playSound("click");
    setIsSigningOut(true);
    try {
      await syncLocalDataBeforeLogout();
      clearLocalAppData();
      await signOut({ callbackUrl: "/" });
    } catch {
      setIsSigningOut(false);
      window.alert("No se pudo guardar todo antes de salir. No borré los datos locales; revisá la conexión e intentá de nuevo.");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--c-bg)" }}>

      {/* ── HEADER — Simplified: logo + title + avatar ── */}
      <header
        className="flex-none h-13 flex items-center gap-3 px-4 sm:px-5 z-30"
        style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)", backdropFilter: "blur(16px)" }}
      >
        {/* App identity */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="hidden sm:flex w-7 h-7 rounded-lg items-center justify-center flex-none" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
            <LayoutDashboard size={14} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate leading-tight" style={{ color: "var(--c-text)" }}>
              Mi Organización
            </p>
          </div>
        </div>

        {/* Right side: avatar → settings */}
        <div className="flex items-center gap-2 flex-none">
          <Link href="/ajustes"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:opacity-80"
            style={isAjustes ? { background: "var(--c-glass)", border: "1px solid var(--c-border)" } : {}}>
          <div
            className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center flex-none"
            style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}
          >
            {avatarEl}
          </div>
          <span className="hidden sm:block text-xs font-semibold truncate max-w-[100px]" style={{ color: "var(--c-text-muted)" }}>
            {displayName}
          </span>
          </Link>
          {status === "authenticated" ? (
            <button
              type="button"
              onClick={() => void handleSafeSignOut()}
              disabled={isSigningOut}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all hover:bg-white/[0.04]"
              style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)", opacity: isSigningOut ? 0.65 : 1 }}
            >
              {isSigningOut ? "Guardando..." : "Salir"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { playSound("click"); void signIn("google"); }}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all hover:bg-white/[0.04]"
              style={{ color: "var(--c-text-muted)", borderColor: "var(--c-border)" }}
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      {status === "unauthenticated" && hasLocalData && (
        <div
          className="flex-none flex items-center gap-3 px-4 sm:px-5 py-2.5 border-b"
          style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}
        >
          <div className="hidden sm:flex w-8 h-8 rounded-xl items-center justify-center flex-none bg-blue-500/15 text-blue-400">
            <Cloud size={16} />
          </div>
          <p className="min-w-0 flex-1 text-xs font-semibold leading-snug" style={{ color: "var(--c-text-muted)" }}>
            Tus datos están guardados solo en este navegador. Iniciá sesión para sincronizarlos y no perderlos al cambiar de computadora.
          </p>
          <button
            type="button"
            onClick={() => { playSound("click"); void signIn("google"); }}
            className="flex-none rounded-lg bg-blue-500 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-blue-400 active:scale-95"
          >
            Sincronizar
          </button>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar desktop — clean, pill active */}
        <aside
          className="hidden sm:flex flex-col w-56 flex-none h-full overflow-hidden"
          style={{ background: "var(--c-surface)", borderRight: "1px solid var(--c-border)" }}
        >
          <nav className="flex-1 scroll-panel px-2.5 py-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const showBadge = item.href === "/calendario" && upcomingBadge > 0;
              return (
                <Link key={item.href} href={item.href}
                  className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200 border ${
                    isActive
                      ? `${item.activeBg} ${item.activeBorder} ${item.color}`
                      : "border-transparent hover:bg-white/[0.04]"
                  }`}
                  style={!isActive ? { color: "var(--c-text-muted)" } : {}}>
                  <span className="relative inline-flex items-center justify-center flex-none">
                    <item.icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    {showBadge && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">{upcomingBadge > 9 ? "9+" : upcomingBadge}</span>}
                  </span>
                  <span className="font-semibold truncate" style={isActive ? {} : { transition: "color 0.2s" }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Settings link at bottom of sidebar */}
          <Link href="/ajustes"
            className={`flex-none flex items-center gap-2.5 mx-2.5 mb-3 px-3 py-2.5 rounded-xl text-[13px] transition-all border ${
              isAjustes ? "bg-zinc-500/12 border-zinc-500/25 text-zinc-300" : "border-transparent hover:bg-white/[0.04]"
            }`}
            style={!isAjustes ? { color: "var(--c-text-muted)" } : {}}>
            <Settings size={17} strokeWidth={isAjustes ? 2.2 : 1.8} />
            <span className="font-semibold">Ajustes</span>
          </Link>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden anim-fade-in" onClick={() => setMobileSidebarOpen(false)} />
        )}
        <aside
          className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col w-72 transition-transform duration-300 ease-out sm:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ background: "var(--c-bg-2)", borderRight: "1px solid var(--c-border)" }}
        >
          <div className="flex-none flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <Link href="/ajustes" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center border" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
                {avatarEl}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{displayName}</p>
                <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>Ver ajustes</p>
              </div>
            </Link>
            <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl transition-all" style={{ color: "var(--c-text-muted)" }}>
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 scroll-panel px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const showBadge = item.href === "/calendario" && upcomingBadge > 0;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all border ${
                    isActive
                      ? `${item.activeBg} ${item.activeBorder} ${item.color}`
                      : "border-transparent hover:bg-white/[0.04]"
                  }`}
                  style={!isActive ? { color: "var(--c-text-muted)" } : {}}>
                  <span className="relative inline-flex items-center justify-center flex-none">
                    <item.icon size={18} />
                    {showBadge && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">{upcomingBadge}</span>}
                  </span>
                  <span className="font-semibold truncate">{item.label}</span>
                </Link>
              );
            })}
            {/* Settings in mobile sidebar */}
            <Link href="/ajustes" onClick={() => setMobileSidebarOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all border ${
                isAjustes ? "bg-zinc-500/12 border-zinc-500/25 text-zinc-300" : "border-transparent hover:bg-white/[0.04]"
              }`}
              style={!isAjustes ? { color: "var(--c-text-muted)" } : {}}>
              <Settings size={18} />
              <span className="font-semibold">Ajustes</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 overflow-hidden min-w-0">{children}</main>
      </div>

      {/* ── Bottom nav mobile — 4 items + floating center ── */}
      <nav
        className="flex-none sm:hidden z-30 relative"
        style={{
          background: "var(--c-surface)",
          borderTop: "1px solid var(--c-border)",
          backdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-around px-2 h-[60px]">
          {/* Item 1: Inicio */}
          <Link href="/" onClick={() => playSound("tap")} className="flex flex-col items-center gap-1 w-14 transition-all" style={pathname === "/" ? { color: "var(--c-text)" } : { color: "var(--c-text-muted)" }}>
            <LayoutDashboard size={20} strokeWidth={pathname === "/" ? 2.2 : 1.8} className={pathname === "/" ? "text-emerald-400" : ""} />
            <span className="text-[10px] font-medium leading-none">Inicio</span>
          </Link>

          {/* Item 2: Calendario */}
          <Link href="/calendario" onClick={() => playSound("tap")} className="flex flex-col items-center gap-1 w-14 transition-all relative" style={pathname.startsWith("/calendario") ? { color: "var(--c-text)" } : { color: "var(--c-text-muted)" }}>
            <Calendar size={20} strokeWidth={pathname.startsWith("/calendario") ? 2.2 : 1.8} className={pathname.startsWith("/calendario") ? "text-rose-400" : ""} />
            {upcomingBadge > 0 && <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--c-surface)]" />}
            <span className="text-[10px] font-medium leading-none">Eventos</span>
          </Link>

          {/* Center Button: Create */}
          <div className="w-14 h-full flex items-center justify-center -mt-6 relative">
            <button type="button" onClick={() => { playSound("click"); setCreateMenuOpen(!createMenuOpen); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${createMenuOpen ? "rotate-45" : ""} active:scale-95`}
              style={{ background: "var(--c-bg)", border: "2px solid var(--c-border-2)", color: "var(--c-text)" }}>
              <Plus size={24} strokeWidth={2} />
            </button>
            
            {/* Create Menu Popover */}
            {createMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setCreateMenuOpen(false)} />
                <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2 w-[220px] rounded-3xl p-2 z-50 flex flex-col gap-1 anim-slide-up shadow-[0_12px_40px_rgba(0,0,0,0.3)] border"
                  style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
                  
                  <Link href="/notas#new" onClick={() => { playSound("tap"); setCreateMenuOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.05] transition-all" style={{ color: "var(--c-text)" }}>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center"><FileText size={18} className="text-blue-400" /></div>
                    <span className="text-sm font-bold">Nueva Nota</span>
                  </Link>
                  
                  <Link href="/calendario#new" onClick={() => { playSound("tap"); setCreateMenuOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.05] transition-all" style={{ color: "var(--c-text)" }}>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center"><Calendar size={18} className="text-rose-400" /></div>
                    <span className="text-sm font-bold">Nuevo Evento</span>
                  </Link>
                  
                  <Link href="/materias#new" onClick={() => { playSound("tap"); setCreateMenuOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.05] transition-all" style={{ color: "var(--c-text)" }}>
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center"><BookOpen size={18} className="text-violet-400" /></div>
                    <span className="text-sm font-bold">Nueva Materia</span>
                  </Link>
                  
                  <Link href="/habitos#new" onClick={() => { playSound("tap"); setCreateMenuOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.05] transition-all" style={{ color: "var(--c-text)" }}>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center"><Activity size={18} className="text-amber-400" /></div>
                    <span className="text-sm font-bold">Nuevo Hábito</span>
                  </Link>

                </div>
              </>
            )}
          </div>

          {/* Item 3: Materias */}
          <Link href="/materias" onClick={() => { playSound("tap"); setCreateMenuOpen(false); }} className="flex flex-col items-center gap-1 w-14 transition-all" style={pathname.startsWith("/materias") ? { color: "var(--c-text)" } : { color: "var(--c-text-muted)" }}>
            <BookOpen size={20} strokeWidth={pathname.startsWith("/materias") ? 2.2 : 1.8} className={pathname.startsWith("/materias") ? "text-violet-400" : ""} />
            <span className="text-[10px] font-medium leading-none">Materias</span>
          </Link>

          {/* Item 4: Menu / Más */}
          <button type="button" onClick={() => { playSound("click"); setMobileSidebarOpen(true); }} className="flex flex-col items-center gap-1 w-14 transition-all" style={{ color: "var(--c-text-muted)" }}>
            <Menu size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium leading-none">Más</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
