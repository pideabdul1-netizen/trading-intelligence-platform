import { NextResponse } from "next/server";
import { fetchForexPreviousClose } from "@/lib/forexHistory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ForexPair = {
  symbol: string;
  base: string;
  quote: string;
};

type ForexQuote = {
  symbol: string;
  price: number | null;
  source: string;
  timestamp: string | null;
  lastAvailableDate: string | null;
  marketStatus: string;
};

const FOREX_PAIRS: ForexPair[] = [
  { symbol: "EURUSD", base: "EUR", quote: "USD" },
  { symbol: "GBPUSD", base: "GBP", quote: "USD" },
  { symbol: "USDJPY", base: "USD", quote: "JPY" }
];

const FOREX_CONVERT_URL = "https://api.exchangerate.host/convert";

function isWeekendUTC(date = new Date()): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

async function fetchLiveForex(pair: ForexPair): Promise<{ price: number; timestamp: string }> {
  const url = new URL(FOREX_CONVERT_URL);
  const accessKey = process.env.EXCHANGERATE_HOST_ACCESS_KEY ?? process.env.EXCHANGE_RATE_API_KEY;
  const query = {
    from: pair.base,
    to: pair.quote,
    amount: "1",
    ...(accessKey ? { access_key: accessKey } : {})
  };
  url.search = new URLSearchParams(query).toString();

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Forex live request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    success?: boolean;
    result?: number | string;
    info?: { rate?: number | string };
  };
  const price = Number(payload.result ?? payload.info?.rate);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`No live rate returned for ${pair.symbol}`);
  }

  return { price, timestamp: new Date().toISOString() };
}

async function getForexQuote(pair: ForexPair): Promise<ForexQuote> {
  const weekend = isWeekendUTC();

  if (!weekend) {
    try {
      const live = await fetchLiveForex(pair);
      return {
        symbol: pair.symbol,
        price: live.price,
        source: "ExchangeRate.host · convert",
        timestamp: live.timestamp,
        lastAvailableDate: null,
        marketStatus: "OPEN · LIVE"
      };
    } catch {
      // A live failure must use the real timeseries fallback below. No price
      // is synthesized from a prior response or a local default.
    }
  }

  try {
    const previousClose = await fetchForexPreviousClose(pair.base, pair.quote);
    return {
      symbol: pair.symbol,
      price: previousClose.rate,
      source: previousClose.source,
      timestamp: `${previousClose.date}T23:59:59.000Z`,
      lastAvailableDate: previousClose.date,
      marketStatus: weekend
        ? `CLOSED (Weekend) - Last Available Close: ${previousClose.date}`
        : `LIVE UNAVAILABLE - Last Available Close: ${previousClose.date}`
    };
  } catch {
    return {
      symbol: pair.symbol,
      price: null,
      source: "ExchangeRate.host · no data",
      timestamp: null,
      lastAvailableDate: null,
      marketStatus: weekend ? "CLOSED (Weekend)" : "OPEN · DATA UNAVAILABLE"
    };
  }
}

export async function GET() {
  const data = await Promise.all(FOREX_PAIRS.map(getForexQuote));
  return NextResponse.json(
    { generatedAt: new Date().toISOString(), data },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
