
import { TRPCError } from "@trpc/server";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF();

export interface MarketData {
  price: number;
  changePercent: number;
  currency: string;
  symbol: string;
}

export async function getCurrentPrices(symbols: string[]): Promise<Record<string, MarketData>> {
  if (symbols.length === 0) return {};

  try {
    const uniqueSymbols = Array.from(new Set(symbols));
    
    // yahoo-finance2 handles the crumbs validation automatically
    const quotes = await yahooFinance.quote(uniqueSymbols);
    
    const results = Array.isArray(quotes) ? quotes : [quotes];
    const marketData: Record<string, MarketData> = {};

    results.forEach((quote: any) => {
      if (quote && quote.symbol) {
        marketData[quote.symbol] = {
          price: quote.regularMarketPrice || quote.postMarketPrice || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          currency: quote.currency || 'USD',
          symbol: quote.symbol
        };
      }
    });

    return marketData;
  } catch (error) {
    console.warn("Error fetching market prices:", error);
    // Return empty object or handle error gracefully so the UI doesn't crash
    return {};
  }
}
