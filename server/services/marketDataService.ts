
import { TRPCError } from "@trpc/server";

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
    const symbolString = uniqueSymbols.join(",");
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbolString}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.quoteResponse?.result || [];

    const marketData: Record<string, MarketData> = {};

    results.forEach((quote: any) => {
      marketData[quote.symbol] = {
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        currency: quote.currency,
        symbol: quote.symbol
      };
    });

    return marketData;
  } catch (error) {
    console.warn("Error fetching market prices:", error);
    // Return empty object or handle error gracefully so the UI doesn't crash
    return {};
  }
}
