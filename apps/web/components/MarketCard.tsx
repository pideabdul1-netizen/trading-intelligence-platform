import { formatDateOnly, formatTimestamp, getFeedStatus, type FeedStatus } from "@/lib/market";

type MarketCardProps = {
  symbol: string;
  price: number | null;
  source: string;
  timestamp: string | null;
  marketStatus: string;
  lastAvailableDate?: string | null;
};

function formatPrice(symbol: string, price: number): string {
  const isForex = !["BTCUSD", "ETHUSD", "BNBUSDT"].includes(symbol);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: isForex ? 4 : 2,
    maximumFractionDigits: isForex ? 5 : 2
  }).format(price);
}

function statusClasses(status: FeedStatus): string {
  if (status === "ONLINE") return "bg-emerald-400";
  if (status === "STALE") return "bg-amber-300";
  return "bg-rose-400";
}

export function MarketCard({
  symbol,
  price,
  source,
  timestamp,
  marketStatus,
  lastAvailableDate
}: MarketCardProps) {
  const feedStatus = getFeedStatus(timestamp, price !== null);
  const unavailable = price === null;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-glow transition duration-200 hover:-translate-y-0.5 hover:border-slate-700">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold tracking-[0.18em] text-slate-300">{symbol}</p>
          <p className="mt-1 text-xs text-slate-500">{marketStatus}</p>
        </div>
        <span className={`mt-1 h-2 w-2 rounded-full ${statusClasses(feedStatus)}`} aria-label={feedStatus} />
      </div>

      <div className="mt-7 min-h-14">
        {unavailable ? (
          <p className="font-mono text-lg font-semibold tracking-wide text-slate-400">WAIT / DATA UNAVAILABLE</p>
        ) : (
          <p className="font-mono text-3xl font-semibold tracking-tight text-slate-100">
            {formatPrice(symbol, price)}
          </p>
        )}
      </div>

      <div className="mt-7 space-y-2 border-t border-slate-800 pt-4 text-xs">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Source</span>
          <span className="text-right text-slate-300">{source}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Timestamp</span>
          <span className="text-right text-slate-300">{formatTimestamp(timestamp)}</span>
        </div>
        {lastAvailableDate ? (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Last available close</span>
            <span className="text-right text-amber-200">{formatDateOnly(lastAvailableDate)}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
