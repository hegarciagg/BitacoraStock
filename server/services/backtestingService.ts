/**
 * Servicio de Backtesting Histórico
 * Simula el rendimiento del portafolio durante eventos históricos reales del mercado
 */

export interface HistoricalEvent {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  impactByAssetClass: {
    [assetClass: string]: number; // Cambio porcentual durante el evento
  };
  severity: "low" | "medium" | "high" | "critical";
  category: "crash" | "recession" | "inflation" | "geopolitical" | "pandemic" | "other";
}

export interface BacktestResult {
  eventId: string;
  eventName: string;
  startValue: number;
  endValue: number;
  returnPercentage: number;
  maxDrawdown: number;
  recoveryDays: number;
  sharpeRatio: number;
  volatility: number;
  monthlyReturns: { month: string; return: number }[];
  assetPerformance: { asset: string; return: number }[];
}

export interface PortfolioAllocation {
  [assetClass: string]: number; // Peso en porcentaje
}

// Eventos históricos predefinidos
export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: "crisis-2008",
    name: "Crisis Financiera Global (2008)",
    description:
      "Colapso del mercado inmobiliario y crisis crediticia que llevó a la mayor recesión desde la Gran Depresión",
    startDate: new Date("2008-09-15"),
    endDate: new Date("2009-03-09"),
    impactByAssetClass: {
      stocks: -0.57,
      bonds: 0.15,
      commodities: -0.55,
      realEstate: -0.35,
      cash: 0.0,
    },
    severity: "critical",
    category: "crash",
  },
  {
    id: "covid-2020",
    name: "Pandemia COVID-19 (2020)",
    description:
      "Caída rápida de mercados seguida de recuperación acelerada durante la pandemia",
    startDate: new Date("2020-02-19"),
    endDate: new Date("2020-03-23"),
    impactByAssetClass: {
      stocks: -0.34,
      bonds: 0.08,
      commodities: -0.25,
      realEstate: -0.15,
      cash: 0.0,
    },
    severity: "high",
    category: "pandemic",
  },
  {
    id: "black-monday-1987",
    name: "Lunes Negro (1987)",
    description: "Caída del 22% en un solo día en el mercado de valores",
    startDate: new Date("1987-10-19"),
    endDate: new Date("1987-10-19"),
    impactByAssetClass: {
      stocks: -0.22,
      bonds: 0.05,
      commodities: -0.1,
      realEstate: -0.05,
      cash: 0.0,
    },
    severity: "high",
    category: "crash",
  },
  {
    id: "dot-com-2000",
    name: "Burbuja Tecnológica (2000-2002)",
    description: "Colapso de empresas de internet y caída prolongada del NASDAQ",
    startDate: new Date("2000-03-10"),
    endDate: new Date("2002-10-09"),
    impactByAssetClass: {
      stocks: -0.78,
      bonds: 0.1,
      commodities: -0.15,
      realEstate: 0.05,
      cash: 0.0,
    },
    severity: "critical",
    category: "crash",
  },
  {
    id: "inflation-1970s",
    name: "Crisis de Inflación (1970s)",
    description: "Período de alta inflación y estancamiento económico",
    startDate: new Date("1973-10-01"),
    endDate: new Date("1974-12-31"),
    impactByAssetClass: {
      stocks: -0.48,
      bonds: -0.25,
      commodities: 1.2,
      realEstate: 0.3,
      cash: -0.15,
    },
    severity: "high",
    category: "inflation",
  },
  {
    id: "brexit-2016",
    name: "Brexit (2016)",
    description: "Referéndum del Reino Unido para salir de la Unión Europea",
    startDate: new Date("2016-06-23"),
    endDate: new Date("2016-07-15"),
    impactByAssetClass: {
      stocks: -0.08,
      bonds: 0.05,
      commodities: -0.05,
      realEstate: -0.03,
      cash: 0.0,
    },
    severity: "medium",
    category: "geopolitical",
  },
  {
    id: "bull-market-2010s",
    name: "Mercado Alcista (2010-2019)",
    description: "Período prolongado de crecimiento económico y retornos positivos",
    startDate: new Date("2010-01-01"),
    endDate: new Date("2019-12-31"),
    impactByAssetClass: {
      stocks: 3.8,
      bonds: 0.4,
      commodities: -0.1,
      realEstate: 0.8,
      cash: 0.02,
    },
    severity: "low",
    category: "other",
  },
];

/**
 * Calcula el rendimiento del portafolio durante un evento histórico
 */
export function calculateBacktestResult(
  allocation: PortfolioAllocation,
  event: HistoricalEvent,
  initialValue: number = 100000
): BacktestResult {
  // Calcular retorno ponderado del portafolio
  let portfolioReturn = 0;
  const assetPerformance: { asset: string; return: number }[] = [];

  for (const [assetClass, weight] of Object.entries(allocation)) {
    const impact = event.impactByAssetClass[assetClass] || 0;
    portfolioReturn += (weight / 100) * impact;
    assetPerformance.push({
      asset: assetClass,
      return: impact,
    });
  }

  // Calcular valores
  const startValue = initialValue;
  const endValue = startValue * (1 + portfolioReturn);
  const returnPercentage = portfolioReturn;

  // Calcular máxima pérdida (drawdown)
  const maxDrawdown = calculateMaxDrawdown(allocation, event);

  // Calcular días de recuperación (estimado)
  const recoveryDays = estimateRecoveryDays(event.severity, maxDrawdown);

  // Calcular Sharpe ratio (estimado)
  const volatility = calculateVolatility(allocation, event);
  const sharpeRatio = volatility > 0 ? returnPercentage / volatility : 0;

  // Generar retornos mensuales (simulado)
  const monthlyReturns = generateMonthlyReturns(allocation, event);

  return {
    eventId: event.id,
    eventName: event.name,
    startValue,
    endValue,
    returnPercentage,
    maxDrawdown,
    recoveryDays,
    sharpeRatio,
    volatility,
    monthlyReturns,
    assetPerformance: assetPerformance.sort((a, b) => b.return - a.return),
  };
}

/**
 * Calcula la máxima pérdida durante un evento
 */
function calculateMaxDrawdown(allocation: PortfolioAllocation, event: HistoricalEvent): number {
  let maxDrawdown = 0;

  for (const [assetClass, weight] of Object.entries(allocation)) {
    const impact = event.impactByAssetClass[assetClass] || 0;
    if (impact < 0) {
      const drawdown = Math.abs(impact) * (weight / 100);
      maxDrawdown += drawdown;
    }
  }

  return Math.min(maxDrawdown, 1); // Máximo 100%
}

/**
 * Estima los días de recuperación basado en la severidad del evento
 */
function estimateRecoveryDays(severity: string, maxDrawdown: number): number {
  const baseRecovery: { [key: string]: number } = {
    low: 30,
    medium: 90,
    high: 180,
    critical: 365,
  };

  const baseDays = baseRecovery[severity] || 90;
  return Math.round(baseDays * (1 + maxDrawdown));
}

/**
 * Calcula la volatilidad del portafolio durante el evento
 */
function calculateVolatility(allocation: PortfolioAllocation, event: HistoricalEvent): number {
  let variance = 0;

  for (const [assetClass, weight] of Object.entries(allocation)) {
    const impact = event.impactByAssetClass[assetClass] || 0;
    variance += Math.pow(impact * (weight / 100), 2);
  }

  return Math.sqrt(variance);
}

/**
 * Genera retornos mensuales simulados durante el evento
 */
function generateMonthlyReturns(
  allocation: PortfolioAllocation,
  event: HistoricalEvent
): { month: string; return: number }[] {
  const returns: { month: string; return: number }[] = [];
  const eventDuration = Math.ceil(
    (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const monthlyImpact = 1;
  for (const [assetClass, weight] of Object.entries(allocation)) {
    const totalImpact = event.impactByAssetClass[assetClass] || 0;
    const monthlyChange = totalImpact / Math.max(eventDuration, 1);

    for (let i = 0; i < eventDuration; i++) {
      const date = new Date(event.startDate);
      date.setMonth(date.getMonth() + i);
      const monthStr = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

      const existing = returns.find((r) => r.month === monthStr);
      if (existing) {
        existing.return += (monthlyChange * weight) / 100;
      } else {
        returns.push({
          month: monthStr,
          return: (monthlyChange * weight) / 100,
        });
      }
    }
  }

  return returns.slice(0, 12); // Máximo 12 meses
}

/**
 * Compara el rendimiento de múltiples asignaciones durante un evento
 */
export function compareBacktestResults(
  allocations: { name: string; allocation: PortfolioAllocation }[],
  event: HistoricalEvent,
  initialValue: number = 100000
): { name: string; result: BacktestResult }[] {
  return allocations.map((item) => ({
    name: item.name,
    result: calculateBacktestResult(item.allocation, event, initialValue),
  }));
}

/**
 * Calcula el rendimiento acumulado durante múltiples eventos
 */
export function calculateCumulativeBacktest(
  allocation: PortfolioAllocation,
  events: HistoricalEvent[],
  initialValue: number = 100000
): {
  totalReturn: number;
  finalValue: number;
  eventResults: BacktestResult[];
  averageReturn: number;
  worstEvent: BacktestResult;
  bestEvent: BacktestResult;
} {
  let currentValue = initialValue;
  const eventResults: BacktestResult[] = [];

  for (const event of events) {
    const result = calculateBacktestResult(allocation, event, currentValue);
    eventResults.push(result);
    currentValue = result.endValue;
  }

  const totalReturn = (currentValue - initialValue) / initialValue;
  const averageReturn = eventResults.reduce((sum, r) => sum + r.returnPercentage, 0) / events.length;

  const worstEvent = eventResults.reduce((worst, current) =>
    current.returnPercentage < worst.returnPercentage ? current : worst
  );

  const bestEvent = eventResults.reduce((best, current) =>
    current.returnPercentage > best.returnPercentage ? current : best
  );

  return {
    totalReturn,
    finalValue: currentValue,
    eventResults,
    averageReturn,
    worstEvent,
    bestEvent,
  };
}
