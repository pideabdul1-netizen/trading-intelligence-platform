# Trading Intelligence Web Dashboard

Next.js 14 dashboard for real forex and crypto market data.

## Data policy

- Forex live rates come only from `https://api.exchangerate.host/convert`.
- Forex weekend and live-request fallback rates come only from `https://api.exchangerate.host/timeseries`, using the previous Friday close.
- Crypto rates come only from `https://api.binance.com/api/v3/ticker/price`.
- If your ExchangeRate.host plan requires authentication, set `EXCHANGERATE_HOST_ACCESS_KEY` (or `EXCHANGE_RATE_API_KEY`) in the deployment environment. The app never embeds or invents a key.
- No local price defaults, mock values, historical guesses, or synthetic prices are used.
- An unavailable quote is rendered as `WAIT / DATA UNAVAILABLE` and the feed is marked `OFFLINE`.

## Run locally

```bash
pnpm install
pnpm dev
```

The Vercel project should use `apps/web` as its Root Directory.
