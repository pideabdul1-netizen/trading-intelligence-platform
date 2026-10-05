import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CryptoPair = {
  symbol: string;
  binanceSymbol: string;
};

type CryptoQuote = {
  symbol: string;
  price: number | null;
  source: string;
  timestamp: string | null;
  marketStatus: "OPEN 24/7";
};

const CRYPTO_PAIRS: CryptoPair[] = [
  { symbol: "BTCUSD", binanceSymbol: "BTCUSDT" },
  { symbol: "ETHUSD", binanceSymbol: "ETHUSDT" },
  { symbol: "BNBUSDT", binanceSymbol: "BNBUSDT" }
];

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price";

async function getCryptoQuote(pair: CryptoPair): Promise<CryptoQuote> {
  try {
    const url = new URL(BINANCE_TICKER_URL);
    url.search = new URLSearchParams({ symbol: pair.binanceSymbol }).toString();
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Binance request failed with ${response.status}`);
    }

    const payload = (await response.json()) as { symbol?: string; price?: string };
    const price = Number(payload.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`No Binance price returned for ${pair.binanceSymbol}`);
    }

    return {
      symbol: pair.symbol,
      price,
      source: `Binance spot · ${pair.binanceSymbol}`,
      timestamp: new Date().toISOString(),
      marketStatus: "OPEN 24/7"
    };
  } catch {
    return {
      symbol: pair.symbol,
      price: null,
      source: `Binance spot · ${pair.binanceSymbol}`,
      timestamp: null,
      marketStatus: "OPEN 24/7"
    };
  }
}

export async function GET() {
  const data = await Promise.all(CRYPTO_PAIRS.map(getCryptoQuote));
  return NextResponse.json(
    { generatedAt: new Date().toISOString(), data },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
