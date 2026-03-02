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
export function setCooldown(currentTime: Date = new Date()): void {
  cooldownUntil = new Date(currentTime.getTime() + 48 * 60 * 60 * 1000);
}
export function clearCooldown(): void {
  cooldownUntil = null;
}
export function isInCooldown(currentTime: Date = new Date()): boolean {
  return cooldownUntil !== null && currentTime < cooldownUntil;
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
  const rsiOk        = !!ind.rsi[i] && ind.rsi[i] < 90;
  const momentumOk   = !!ind.momentum[i] && ind.momentum[i] > 1;
  const volatilityOk = !!ind.volatility[i] && ind.volatility[i] < 0.06;
  const volumeOk     = !!ind.volumeSMA[i] && ind.volumeSMA[i] > 0;
  const adxOk        = !!ind.adx[i] && ind.adx[i] > 25;
  const ema50Ok      = !!ind.ema50[i] && price > ind.ema50[i];
  const ema200Ok     = !!ind.ema200[i] && price > ind.ema200[i];
  const macdOk       = !!ind.macd[i] && !!ind.signal[i] && ind.macd[i] > ind.signal[i];

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
  inPosition:   boolean = false,
  currentTime:  Date = new Date()
): SignalDecision {
  const isBull = currentState === bullState;
  const isBear = currentState === bearState;

  // Priority 1: exit if bear regime
  if (isBear) {
    setCooldown(currentTime);
    return {
      signal:        "CASH",
      regime:        currentState,
      bullState,
      bearState,
      votingScore:   voting.score,
      checks:        voting.checks,
      cooldownUntil,
      reason:        "Bear regime detected — exit and cooldown",
    };
  }

  // Priority 2: cooldown active
  if (isInCooldown(currentTime)) {
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

  // Priority 3: Maintain position if we are in it and things aren't terrible
  if (inPosition && !isBear && voting.score >= 3) {
    return {
      signal:        "LONG",
      regime:        currentState,
      bullState,
      bearState,
      votingScore:   voting.score,
      checks:        voting.checks,
      cooldownUntil: null,
      reason:        `Holding position (${voting.score}/8 confirmations)`,
    };
  }

  // Priority 4: enter new position
  if (isBull && voting.score >= 5) {
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
      ? `Bull regime but weak signal: ${voting.score}/8 confirmations`
      : `Neutral regime (state ${currentState}) without strong signal`,
  };
}
