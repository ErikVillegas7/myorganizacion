export function CircularProgress({ pct, colorClass, size = 44, stroke = 4 }: {
  pct: number; colorClass: string; size?: number; stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--c-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" className={`transition-all duration-1000 ${colorClass}`}
          stroke="currentColor" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color: "var(--c-text)" }}>{pct}%</span>
    </div>
  );
}
