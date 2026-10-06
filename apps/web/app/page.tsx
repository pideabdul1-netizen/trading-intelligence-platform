"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedStatusBar } from "@/components/FeedStatusBar";
import { InstallAppButton } from "@/components/PwaControls";
import { MarketCard } from "@/components/MarketCard";
import { getFeedStatus, type FeedStatus } from "@/lib/market";

type MarketQuote = {
  symbol: string;
  price: number | null;
  source: string;
  timestamp: string | null;
  lastAvailableDate?: string | null;
  marketStatus: string;
};

type QuotePayload = {
  generatedAt: string;
  data: MarketQuote[];
};

const FOREX_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY"];
const CRYPTO_SYMBOLS = ["BTCUSD", "ETHUSD", "BNBUSDT"];

const emptyQuote = (symbol: string, source: string, marketStatus: string): MarketQuote => ({
  symbol,
  price: null,
  source,
  timestamp: null,
  lastAvailableDate: null,
  marketStatus
});

const initialForex = FOREX_SYMBOLS.map((symbol) =>
  emptyQuote(symbol, "ExchangeRate.host · waiting", "WAITING FOR MARKET DATA")
);
const initialCrypto = CRYPTO_SYMBOLS.map((symbol) =>
  emptyQuote(symbol, "Binance spot · waiting", "OPEN 24/7")
);

function sectionStatus(quotes: MarketQuote[]): FeedStatus {
  const statuses = quotes.map((quote) => getFeedStatus(quote.timestamp, quote.price !== null));
  if (statuses.some((status) => status === "ONLINE")) return "ONLINE";
  if (statuses.some((status) => status === "STALE")) return "STALE";
  return "OFFLINE";
}

function mergeQuotes(expectedSymbols: string[], incoming: MarketQuote[] | undefined, fallback: MarketQuote[]) {
  const bySymbol = new Map((incoming ?? []).map((quote) => [quote.symbol, quote]));
  return expectedSymbols.map((symbol, index) => bySymbol.get(symbol) ?? fallback[index]);
}

export default function DashboardPage() {
  const [forex, setForex] = useState<MarketQuote[]>(initialForex);
  const [crypto, setCrypto] = useState<MarketQuote[]>(initialCrypto);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setRequestError(null);

    try {
      const [forexResponse, cryptoResponse] = await Promise.all([
        fetch("/api/market", { cache: "no-store" }),
        fetch("/api/crypto", { cache: "no-store" })
      ]);

      const forexPayload = forexResponse.ok ? ((await forexResponse.json()) as QuotePayload) : undefined;
      const cryptoPayload = cryptoResponse.ok ? ((await cryptoResponse.json()) as QuotePayload) : undefined;

      setForex(mergeQuotes(FOREX_SYMBOLS, forexPayload?.data, initialForex));
      setCrypto(mergeQuotes(CRYPTO_SYMBOLS, cryptoPayload?.data, initialCrypto));
      setLastRefresh(new Date().toISOString());

      if (!forexResponse.ok || !cryptoResponse.ok) {
        setRequestError("One or more market feeds could not be reached. Showing only verified data returned by the APIs.");
      }
    } catch {
      setForex(initialForex);
      setCrypto(initialCrypto);
      setRequestError("Market feeds are unreachable. No fallback or synthetic prices are shown.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const forexStatus = useMemo(() => sectionStatus(forex), [forex]);
  const cryptoStatus = useMemo(() => sectionStatus(crypto), [crypto]);

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-slate-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.9)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Trading intelligence</p>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">Live market dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Verified spot pricing for major forex and crypto pairs. Prices are fetched in the browser from our server routes, with no local defaults or invented values.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap gap-2">
              <InstallAppButton />
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh feeds"}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {lastRefresh ? `Last checked ${new Date(lastRefresh).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Awaiting first response"}
            </p>
          </div>
        </header>

        {requestError ? (
          <div className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" role="status">
            {requestError}
          </div>
        ) : null}

        <section className="mt-8" aria-labelledby="forex-heading">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">01 · Foreign exchange</p>
              <h2 id="forex-heading" className="mt-1 text-xl font-semibold text-slate-100">Forex monitor</h2>
            </div>
            <FeedStatusBar
              label="Forex feed"
              status={forexStatus}
              detail="ExchangeRate.host · convert / timeseries"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {forex.map((quote) => <MarketCard key={quote.symbol} {...quote} />)}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="crypto-heading">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">02 · Digital assets</p>
              <h2 id="crypto-heading" className="mt-1 text-xl font-semibold text-slate-100">Crypto monitor</h2>
            </div>
            <FeedStatusBar label="Crypto feed" status={cryptoStatus} detail="Binance spot ticker · 24/7" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {crypto.map((quote) => <MarketCard key={quote.symbol} {...quote} />)}
          </div>
        </section>

        <footer className="mt-12 flex flex-col gap-2 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Forex weekend policy: previous Friday close from ExchangeRate.host timeseries.</p>
          <p>Crypto market status: always OPEN 24/7; price source is Binance.</p>
        </footer>
      </div>
    </main>
  );
}
