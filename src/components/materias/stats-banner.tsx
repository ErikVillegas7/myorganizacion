type Stats = {
  total: number;
  promocion: number;
  regular: number;
  abandono: number;
  libre: number;
  asistenciaRiesgo: number;
};

export function StatsBanner({ stats }: { stats: Stats }) {
  if (stats.total === 0) return null;

  const items = [
    { label: "Promoción",   count: stats.promocion,        color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Regular",     count: stats.regular,          color: "text-amber-400 bg-amber-500/10" },
    { label: "Libre",       count: stats.libre,            color: "text-zinc-400 bg-zinc-500/10" },
    { label: "Abandono",    count: stats.abandono,         color: "text-rose-400 bg-rose-500/10" },
    ...(stats.asistenciaRiesgo > 0 ? [{ label: "⚠ Asistencia", count: stats.asistenciaRiesgo, color: "text-rose-400 bg-rose-500/10 font-black" }] : []),
  ].filter(s => s.count > 0);

  return (
    <div className="flex-none px-4 sm:px-6 lg:px-8 pb-3 desktop-page-shell">
      <div className="flex gap-2 overflow-x-auto scroll-x pb-1">
        {items.map(s => (
          <div key={s.label} className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${s.color}`}>
            <span>{s.count}</span><span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
