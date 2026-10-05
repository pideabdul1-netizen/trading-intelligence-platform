import { FeedStatus } from "@/lib/market";

const STATUS_COPY: Record<FeedStatus, { label: string; className: string }> = {
  ONLINE: { label: "🟢 ONLINE", className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" },
  STALE: { label: "🟡 STALE", className: "border-amber-400/25 bg-amber-400/10 text-amber-200" },
  OFFLINE: { label: "🔴 OFFLINE", className: "border-rose-400/25 bg-rose-400/10 text-rose-300" }
};

type FeedStatusBarProps = {
  label: string;
  status: FeedStatus;
  detail?: string;
};

export function FeedStatusBar({ label, status, detail }: FeedStatusBarProps) {
  const copy = STATUS_COPY[status];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-glow">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</span>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] ${copy.className}`}>
          {copy.label}
        </span>
      </div>
      {detail ? <span className="text-xs text-slate-500">{detail}</span> : null}
    </div>
  );
}
