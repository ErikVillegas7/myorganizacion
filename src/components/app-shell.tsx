"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, Calendar, BookOpen,
  Activity, Menu, X, Settings,
} from "lucide-react";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useSettings } from "@/lib/use-settings";

type AppShellProps = { children: React.ReactNode };

/* 5 items — Ajustes se accede desde el avatar */
const navItems = [
  { href: "/",           label: "Inicio",     icon: LayoutDashboard, color: "text-emerald-400", activeBg: "bg-emerald-500/12", activeBorder: "border-emerald-500/25" },
  { href: "/notas",      label: "Notas",      icon: FileText,        color: "text-blue-400",    activeBg: "bg-blue-500/12",    activeBorder: "border-blue-500/25" },
  { href: "/calendario", label: "Calendario", icon: Calendar,        color: "text-rose-400",    activeBg: "bg-rose-500/12",    activeBorder: "border-rose-500/25" },
  { href: "/materias",   label: "Materias",   icon: BookOpen,        color: "text-violet-400",  activeBg: "bg-violet-500/12",  activeBorder: "border-violet-500/25" },
  { href: "/habitos",    label: "Hábitos",    icon: Activity,        color: "text-amber-400",   activeBg: "bg-amber-500/12",   activeBorder: "border-amber-500/25" },
];

type CalEvent = { id: string; date: string };

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [events] = useLocalStorageState<CalEvent[]>("mo_events", []);
  const [settings] = useSettings();

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const activeItem = useMemo(
    () => navItems.find((item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)),
    [pathname],
  );

  const isAjustes = pathname.startsWith("/ajustes");

  const upcomingBadge = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in7 = new Date(today); in7.setDate(today.getDate() + 7);
    return events.filter((e) => {
      const d = new Date(`${e.date}T00:00:00`);
      return d >= today && d <= in7;
    }).length;
  }, [events]);

  const avatarEl = settings.avatar ? (
    <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
  ) : (
    <span className="text-[11px] font-bold" style={{ color: "var(--c-text)" }}>
      {(settings.name?.[0] ?? "U").toUpperCase()}
    </span>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--c-bg)" }}>

      {/* ── HEADER — Simplified: logo + title + avatar ── */}
      <header
        className="flex-none h-13 flex items-center gap-3 px-4 sm:px-5 z-30"
        style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)", backdropFilter: "blur(16px)" }}
      >
        {/* Mobile hamburger */}
        <button type="button" onClick={() => setMobileSidebarOpen(true)}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl sm:hidden transition-colors"
          style={{ color: "var(--c-text-muted)" }}
          aria-label="Abrir menu">
          <Menu size={20} />
        </button>

        {/* App identity */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="hidden sm:flex w-7 h-7 rounded-lg items-center justify-center flex-none" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
            <LayoutDashboard size={14} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate leading-tight" style={{ color: "var(--c-text)" }}>
              {activeItem?.label ?? (isAjustes ? "Ajustes" : "Mi Organización")}
            </p>
          </div>
        </div>

        {/* Right side: avatar → settings */}
        <Link href="/ajustes"
          className="flex items-center gap-2 flex-none rounded-xl px-2 py-1.5 transition-all hover:opacity-80"
          style={isAjustes ? { background: "var(--c-glass)", border: "1px solid var(--c-border)" } : {}}>
          <div
            className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center flex-none"
            style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}
          >
            {avatarEl}
          </div>
          <span className="hidden sm:block text-xs font-semibold truncate max-w-[100px]" style={{ color: "var(--c-text-muted)" }}>
            {settings.name}
          </span>
        </Link>
      </header>

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
                  <span className={`font-semibold truncate ${isActive ? "" : "group-hover:text-white/70"}`} style={isActive ? {} : { transition: "color 0.2s" }}>
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
                <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{settings.name}</p>
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

      {/* ── Bottom nav mobile — 5 items, generous touch targets ── */}
      <nav
        className="flex-none sm:hidden z-30"
        style={{
          background: "var(--c-surface)",
          borderTop: "1px solid var(--c-border)",
          backdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="grid grid-cols-5 px-1">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const showBadge = item.href === "/calendario" && upcomingBadge > 0;
            return (
              <Link key={`m-${item.href}`} href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 transition-all ${isActive ? "text-white" : ""}`}
                style={!isActive ? { color: "var(--c-text-muted)" } : {}}>
                <span className={`relative inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive ? `${item.activeBg} ${item.color}` : ""
                }`}>
                  <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                  {showBadge && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-rose-500 text-[7px] font-bold text-white">{upcomingBadge}</span>}
                </span>
                <span className="text-[11px] font-medium truncate w-full text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
