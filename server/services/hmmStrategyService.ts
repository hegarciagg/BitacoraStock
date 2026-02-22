/**
 * hmmStrategyService.ts
 * Evaluates the 8-confirmation institutional voting system,
 * generates LONG / CASH signal, and manages the 48h cooldown.
 */

import type { TechnicalIndicators, OHLCVBar } from "./hmmFeatureService";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Signal = "LONG" | "CASH";

export interface VotingResult {
  score:          number;           // 0–8
  checks: {
    rsiOk:        boolean;          // RSI < 90
    momentumOk:   boolean;          // Momentum > 1%
    volatilityOk: boolean;          // Volatility < 6%
    volumeOk:     boolean;          // Volume > SMA20
    adxOk:        boolean;          // ADX > 25
    ema50Ok:      boolean;          // Price > EMA50
    ema200Ok:     boolean;          // Price > EMA200
    macdOk:       boolean;          // MACD > Signal
  };
}

export interface SignalDecision {
  signal:       Signal;
  regime:       number;
  bullState:    number;
  bearState:    number;
  votingScore:  number;
  checks:       VotingResult["checks"];
  cooldownUntil: Date | null;
  reason:       string;
}

// ── Cooldown state (in-memory, per process) ───────────────────────────────────
let cooldownUntil: Date | null = null;

export function getCooldownUntil(): Date | null { return cooldownUntil; }
export function setCooldown(): void {
  cooldownUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
}
export function clearCooldown(): void {
  cooldownUntil = null;
}
export function isInCooldown(): boolean {
  return cooldownUntil !== null && new Date() < cooldownUntil;
}

// ── Voting engine ─────────────────────────────────────────────────────────────
/**
 * Evaluate the 8 institutional confirmations at index `i`.
 * All NaN-safe: a confirmation is only TRUE if the value is numeric + passes.
 */
export function evaluateVoting(
  i: number,
  price: number,
  ind: TechnicalIndicators,
): VotingResult {
  const safe = (v: number | undefined) => (v === undefined || isNaN(v) ? 0 : v);

  const rsiOk        = safe(ind.rsi[i])       < 90;
  const momentumOk   = safe(ind.momentum[i])  > 1;
  const volatilityOk = safe(ind.volatility[i])< 0.06;   // expressed as pct (std of returns)
  const volumeOk     = safe(ind.volumeSMA[i]) > 0;       // we compare actual vol vs sma below
  const adxOk        = safe(ind.adx[i])       > 25;
  const ema50Ok      = !isNaN(ind.ema50[i])   && price > ind.ema50[i];
  const ema200Ok     = !isNaN(ind.ema200[i])  && price > ind.ema200[i];
  const macdOk       = !isNaN(ind.macd[i]) && !isNaN(ind.signal[i]) && ind.macd[i] > ind.signal[i];

  const checks = { rsiOk, momentumOk, volatilityOk, volumeOk, adxOk, ema50Ok, ema200Ok, macdOk };
  const score  = Object.values(checks).filter(Boolean).length;

  return { score, checks };
}

// ── Signal generator ──────────────────────────────────────────────────────────
export function generateSignal(
  currentState: number,
  bullState:    number,
  bearState:    number,
  voting:       VotingResult,
): SignalDecision {
  const isBull = currentState === bullState;
  const isBear = currentState === bearState;

  // Priority 1: exit if bear regime
  if (isBear) {
    setCooldown();
    return {
      signal:        "CASH",
      regime:        currentState,
      bullState,
      bearState,
      votingScore:   voting.score,
      checks:        voting.checks,
      cooldownUntil,
      reason:        "Bear regime detected — exit and cooldown 48h",
    };
  }

  // Priority 2: cooldown active
  if (isInCooldown()) {
    return {
      signal:        "CASH",
      regime:        currentState,
      bullState,
      bearState,
      votingScore:   voting.score,
      checks:        voting.checks,
      cooldownUntil,
      reason:        `Cooldown active until ${cooldownUntil?.toISOString()}`,
    };
  }

  // Priority 3: bull regime + sufficient voting score
  if (isBull && voting.score >= 7) {
    return {
      signal:        "LONG",
      regime:        currentState,
      bullState,
      bearState,
      votingScore:   voting.score,
      checks:        voting.checks,
      cooldownUntil: null,
      reason:        `Bull regime + ${voting.score}/8 confirmations`,
    };
  }

  return {
    signal:        "CASH",
    regime:        currentState,
    bullState,
    bearState,
    votingScore:   voting.score,
    checks:        voting.checks,
    cooldownUntil: null,
    reason:        isBull
      ? `Bull regime but only ${voting.score}/8 confirmations (need ≥7)`
      : `Neutral regime (state ${currentState})`,
  };
}
