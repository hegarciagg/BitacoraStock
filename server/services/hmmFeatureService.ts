/**
 * hmmFeatureService.ts
 * Fetches BTC-USD 1H OHLCV data (last 730 days) from Yahoo Finance
 * and computes all HMM inputs + technical indicators.
 */

import https from "https";

// ── Asset Catalog (mirrors stock/js/config.js) ────────────────────────────────
export const ASSET_CATALOG = {
  CRYPTO: [
    { symbol: "BTC-USD",  name: "Bitcoin" },
    { symbol: "ETH-USD",  name: "Ethereum" },
    { symbol: "SOL-USD",  name: "Solana" },
    { symbol: "ADA-USD",  name: "Cardano" },
    { symbol: "XRP-USD",  name: "XRP" },
  ],
  ETF: [
    { symbol: "VOO",  name: "Vanguard S&P 500 ETF" },
    { symbol: "SCHH", name: "Schwab US REIT ETF" },
    { symbol: "ARTY", name: "Arty ETF" },
    { symbol: "AU",   name: "AngloGold Ashanti" },
  ],
  STOCKS: [
    { symbol: "MSFT",  name: "Microsoft" },
    { symbol: "GOOGL", name: "Alphabet (Google)" },
    { symbol: "QCOM",  name: "Qualcomm" },
    { symbol: "TSM",   name: "Taiwan Semiconductor" },
    { symbol: "MARA",  name: "Marathon Digital" },
    { symbol: "EC",    name: "Ecopetrol" },
  ],
} as const;

export type AssetSymbol = typeof ASSET_CATALOG[keyof typeof ASSET_CATALOG][number]["symbol"];
export const ALL_SYMBOLS: string[] = [
  ...ASSET_CATALOG.CRYPTO.map(a => a.symbol),
  ...ASSET_CATALOG.ETF.map(a => a.symbol),
  ...ASSET_CATALOG.STOCKS.map(a => a.symbol),
];

export interface OHLCVBar {
  time:   Date;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export interface HMMFeatures {
  returns:       number[];
  range:         number[];
  volVolatility: number[];
}

export interface TechnicalIndicators {
  rsi:       number[];
  momentum:  number[];
  volatility: number[];
  adx:       number[];
  ema50:     number[];
  ema200:    number[];
  macd:      number[];
  signal:    number[];
  volumeSMA: number[];
}

export interface FeatureSet {
  candles:    OHLCVBar[];
  hmm:        HMMFeatures;
  indicators: TechnicalIndicators;
}

// ── Yahoo Finance fetch ───────────────────────────────────────────────────────
function fetchYahooChart(symbol: string, interval: string, range: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includeAdjustedClose=false`;
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HMMService/1.0)",
        "Accept": "application/json",
      },
    };
    https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

export async function fetchCandles(symbol = "BTC-USD"): Promise<OHLCVBar[]> {
  const json = await fetchYahooChart(symbol, "1h", "730d");
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo Finance: empty response for ${symbol}`);

  const timestamps: number[] = result.timestamp;
  const q = result.indicators.quote[0];
  const bars: OHLCVBar[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    if (q.close[i] == null || q.open[i] == null) continue;
    bars.push({
      time:   new Date(timestamps[i] * 1000),
      open:   q.open[i],
      high:   q.high[i],
      low:    q.low[i],
      close:  q.close[i],
      volume: q.volume[i] ?? 0,
    });
  }
  return bars;
}

// ── HMM Features ─────────────────────────────────────────────────────────────
export function computeHMMFeatures(bars: OHLCVBar[]): HMMFeatures {
  const returns:       number[] = [];
  const range:         number[] = [];
  const volVolatility: number[] = [];

  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1];
    const curr = bars[i];
    returns.push((curr.close - prev.close) / prev.close);
    range.push((curr.high - curr.low) / curr.close);
    volVolatility.push(prev.volume !== 0 ? (curr.volume - prev.volume) / prev.volume : 0);
  }
  return { returns, range, volVolatility };
}

// ── EMA helper ────────────────────────────────────────────────────────────────
function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = new Array(values.length).fill(NaN);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result[i] = prev;
  }
  return result;
}

// ── SMA helper ────────────────────────────────────────────────────────────────
function sma(values: number[], period: number): number[] {
  return values.map((_, i) => {
    if (i < period - 1) return NaN;
    return values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  });
}

// ── RSI ───────────────────────────────────────────────────────────────────────
function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(NaN);
  let avgGain = 0, avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const d = closes[i] - closes[i - 1];
      const gain = d > 0 ? d : 0;
      const loss = d < 0 ? -d : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }
  return rsi;
}

// ── ADX (simplified) ─────────────────────────────────────────────────────────
function computeADX(bars: OHLCVBar[], period = 14): number[] {
  const adx: number[] = new Array(bars.length).fill(NaN);
  const trArr: number[] = [];
  const dmPArr: number[] = [];
  const dmMArr: number[] = [];

  for (let i = 1; i < bars.length; i++) {
    const curr = bars[i], prev = bars[i - 1];
    const tr = Math.max(curr.high - curr.low, Math.abs(curr.high - prev.close), Math.abs(curr.low - prev.close));
    const dmP = curr.high - prev.high > prev.low - curr.low ? Math.max(curr.high - prev.high, 0) : 0;
    const dmM = prev.low - curr.low > curr.high - prev.high ? Math.max(prev.low - curr.low, 0) : 0;
    trArr.push(tr); dmPArr.push(dmP); dmMArr.push(dmM);
  }

  for (let i = period - 1; i < trArr.length; i++) {
    const atr = trArr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    const diP = 100 * dmPArr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / atr;
    const diM = 100 * dmMArr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / atr;
    const dx = Math.abs(diP - diM) / (diP + diM) * 100;
    adx[i + 1] = dx;
  }
  return adx;
}

// ── Volatility (rolling std) ──────────────────────────────────────────────────
function rollingStd(values: number[], period: number): number[] {
  return values.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    return Math.sqrt(variance);
  });
}

// ── Master compute ────────────────────────────────────────────────────────────
export function computeIndicators(bars: OHLCVBar[]): TechnicalIndicators {
  const closes  = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);

  const ema12  = ema(closes, 12);
  const ema26  = ema(closes, 26);
  const ema50  = ema(closes, 50);
  const ema200 = ema(closes, 200);

  const macdLine   = ema12.map((v, i) => isNaN(ema26[i]) ? NaN : v - ema26[i]);
  const signalLine = ema(macdLine.filter(v => !isNaN(v)), 9);
  // Pad signal line to full length
  const signalFull = new Array(bars.length).fill(NaN);
  const macdStart  = macdLine.findIndex(v => !isNaN(v));
  signalLine.forEach((v, i) => { signalFull[macdStart + i] = v; });

  const momentum: number[] = new Array(bars.length).fill(NaN);
  for (let i = 12; i < closes.length; i++) {
    momentum[i] = (closes[i] / closes[i - 12] - 1) * 100;
  }

  return {
    rsi:       computeRSI(closes, 14),
    momentum,
    volatility: rollingStd(closes.map((c, i) => i === 0 ? 0 : (c - closes[i-1]) / closes[i-1]), 24),
    adx:       computeADX(bars, 14),
    ema50,
    ema200,
    macd:      macdLine,
    signal:    signalFull,
    volumeSMA: sma(volumes, 20),
  };
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function fetchAndComputeFeatures(symbol = "BTC-USD"): Promise<FeatureSet> {
  const candles    = await fetchCandles(symbol);
  const hmm        = computeHMMFeatures(candles);
  const indicators = computeIndicators(candles);
  return { candles, hmm, indicators };
}
