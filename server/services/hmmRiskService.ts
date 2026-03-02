/**
 * hmmRiskService.ts
 * Runs a full historical backtest of the HMM strategy.
 *
 * Constants: initialCapital = $10,000, leverage = 1.3x
 * PnL formula: ((exitPrice - entryPrice) / entryPrice) * capital * leverage
 */

import type { OHLCVBar, TechnicalIndicators } from "./hmmFeatureService";
import { evaluateVoting, generateSignal, setCooldown, clearCooldown, isInCooldown } from "./hmmStrategyService";

// ── Config ────────────────────────────────────────────────────────────────────
export const INITIAL_CAPITAL = 10_000;
export const LEVERAGE        = 1.3;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SimulatedTrade {
  entryIndex:    number;
  exitIndex:     number;
  entryPrice:    number;
  exitPrice:     number;
  entryTime:     Date;
  exitTime:      Date;
  capitalBefore: number;
  capitalAfter:  number;
  pnl:           number;
  regime:        number;
  confirmations: number;
}

export interface EquityPoint {
  timestamp: Date;
  equity:    number;
  drawdown:  number;
  regime:    number;
}

export interface BacktestResult {
  trades:       SimulatedTrade[];
  equityCurve:  EquityPoint[];
  metrics: {
    totalReturn:    number;  // pct
    bhReturn:       number;  // pct  (BTC buy & hold)
    alpha:          number;  // pct  totalReturn - bhReturn
    winRate:        number;  // pct
    maxDrawdown:    number;  // pct (negative)
    totalTrades:    number;
    finalCapital:   number;
  };
}

// ── Backtest Core ─────────────────────────────────────────────────────────────
export function runBacktest(
  candles:    OHLCVBar[],
  states:     number[],
  bullState:  number,
  bearState:  number,
  indicators: TechnicalIndicators,
): BacktestResult {
  // Reset cooldown for backtest simulation
  clearCooldown();

  let capital          = INITIAL_CAPITAL;
  let inPosition       = false;
  let entryPrice       = 0;
  let entryIndex       = 0;
  let entryCapital     = 0;
  let entryRegime      = 0;
  let entryConfirm     = 0;

  const trades:       SimulatedTrade[] = [];
  const equityCurve:  EquityPoint[]    = [];
  let   rollingMax    = capital;

  // Align: features start at index 1 (first candle has no previous)
  // states array is same length as hmm features = candles.length - 1
  // So states[i] corresponds to candles[i + 1]
  const OFFSET = 1;

  for (let i = 0; i < states.length; i++) {
    const barIdx  = i + OFFSET;
    const bar     = candles[barIdx];
    if (!bar) continue;

    const price  = bar.close;
    const state  = states[i];
    const voting = evaluateVoting(barIdx, price, indicators);
    const decision = generateSignal(state, bullState, bearState, voting, inPosition, bar.time);

    if (!inPosition && decision.signal === "LONG") {
      // Enter position
      inPosition    = true;
      entryPrice    = price;
      entryIndex    = barIdx;
      entryCapital  = capital;
      entryRegime   = state;
      entryConfirm  = voting.score;
    } else if (inPosition && decision.signal !== "LONG") {
      // Exit position
      const pnl       = ((price - entryPrice) / entryPrice) * entryCapital * LEVERAGE;
      capital         = entryCapital + pnl;

      trades.push({
        entryIndex,
        exitIndex:    barIdx,
        entryPrice,
        exitPrice:    price,
        entryTime:    candles[entryIndex].time,
        exitTime:     bar.time,
        capitalBefore: entryCapital,
        capitalAfter:  capital,
        pnl,
        regime:       entryRegime,
        confirmations: entryConfirm,
      });

      inPosition = false;

      // Trigger cooldown if bearish exit
      if (state === bearState) setCooldown(bar.time);
    }

    // Equity curve snapshot
    const currentEquity = inPosition
      ? entryCapital + ((price - entryPrice) / entryPrice) * entryCapital * LEVERAGE
      : capital;

    rollingMax = Math.max(rollingMax, currentEquity);
    const drawdown = (currentEquity - rollingMax) / rollingMax;

    equityCurve.push({
      timestamp: bar.time,
      equity:    currentEquity,
      drawdown,
      regime:    state,
    });
  }

  // Close any open position at last bar
  if (inPosition && candles.length > 0) {
    const lastBar   = candles[candles.length - 1];
    const price     = lastBar.close;
    const pnl       = ((price - entryPrice) / entryPrice) * entryCapital * LEVERAGE;
    capital         = entryCapital + pnl;
    trades.push({
      entryIndex,
      exitIndex:    candles.length - 1,
      entryPrice,
      exitPrice:    price,
      entryTime:    candles[entryIndex].time,
      exitTime:     lastBar.time,
      capitalBefore: entryCapital,
      capitalAfter:  capital,
      pnl,
      regime:       entryRegime,
      confirmations: entryConfirm,
    });
  }

  // ── Metrics ────────────────────────────────────────────────────────────────
  const firstClose = candles[0].close;
  const lastClose  = candles[candles.length - 1].close;
  const bhReturn   = (lastClose - firstClose) / firstClose * 100;
  const totalReturn = (capital - INITIAL_CAPITAL) / INITIAL_CAPITAL * 100;
  const alpha      = totalReturn - bhReturn;
  const wins       = trades.filter(t => t.pnl > 0).length;
  const winRate    = trades.length > 0 ? wins / trades.length * 100 : 0;
  const maxDrawdown = equityCurve.length > 0
    ? Math.min(...equityCurve.map(e => e.drawdown)) * 100
    : 0;

  return {
    trades,
    equityCurve,
    metrics: {
      totalReturn,
      bhReturn,
      alpha,
      winRate,
      maxDrawdown,
      totalTrades: trades.length,
      finalCapital: capital,
    },
  };
}
