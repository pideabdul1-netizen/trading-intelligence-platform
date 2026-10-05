export type ForexPreviousClose = {
  base: string;
  quote: string;
  rate: number;
  date: string;
  source: string;
};

type TimeseriesResponse = {
  success?: boolean;
  rates?: Record<string, Record<string, number | string>>;
};

const FOREX_TIMESERIES_URL = "https://api.exchangerate.host/timeseries";

function toUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPreviousFriday(now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay();

  // For Friday, use the prior completed Friday rather than a potentially
  // incomplete same-day close. On Saturday/Sunday, use the most recent Friday.
  const daysBack = day === 5 ? 7 : day >= 6 ? day - 5 : day + 2;
  date.setUTCDate(date.getUTCDate() - daysBack);
  return toUTCDateString(date);
}

export async function fetchForexPreviousClose(
  base: string,
  quote: string,
  now = new Date()
): Promise<ForexPreviousClose> {
  const normalizedBase = base.toUpperCase();
  const normalizedQuote = quote.toUpperCase();
  const date = getPreviousFriday(now);
  const url = new URL(FOREX_TIMESERIES_URL);
  const accessKey = process.env.EXCHANGERATE_HOST_ACCESS_KEY ?? process.env.EXCHANGE_RATE_API_KEY;
  const query = {
    start_date: date,
    end_date: date,
    base: normalizedBase,
    symbols: normalizedQuote,
    ...(accessKey ? { access_key: accessKey } : {})
  };
  url.search = new URLSearchParams(query).toString();

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Forex history request failed with ${response.status}`);
  }

  const payload = (await response.json()) as TimeseriesResponse;
  const rateValue = payload.rates?.[date]?.[normalizedQuote];
  const rate = Number(rateValue);

  if (!payload.rates || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`No previous Friday close returned for ${normalizedBase}/${normalizedQuote}`);
  }

  return {
    base: normalizedBase,
    quote: normalizedQuote,
    rate,
    date,
    source: "ExchangeRate.host · timeseries"
  };
}
