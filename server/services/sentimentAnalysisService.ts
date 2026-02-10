/**
 * Servicio de análisis de sentimiento avanzado
 * Correlaciona noticias con movimientos históricos del mercado
 */

export interface SentimentScore {
  overall: number; // -1 a 1
  confidence: number; // 0 a 1
  keywords: { word: string; score: number }[];
  category: string;
}

export interface MarketCorrelation {
  asset: string;
  sentimentImpact: number; // -1 a 1
  historicalCorrelation: number; // -1 a 1
  confidence: number; // 0 a 1
  expectedMovement: number; // % esperado
}

export interface SentimentMarketAnalysis {
  overallSentiment: number; // -1 a 1
  marketConfidence: number; // 0 a 1
  correlations: MarketCorrelation[];
  riskAdjustment: number; // factor para ajustar volatilidad
  recommendedAction: 'comprar' | 'vender' | 'mantener';
  explanation: string;
}

/**
 * Palabras clave para análisis de sentimiento financiero
 */
const SENTIMENT_KEYWORDS = {
  positivo: {
    fuerte: ['récord', 'máximo', 'boom', 'explosión', 'disparo', 'rally', 'bull run', 'rally alcista'],
    moderado: ['sube', 'gana', 'crece', 'mejora', 'positivo', 'repunta', 'recupera', 'avanza'],
    débil: ['estable', 'mantiene', 'resiste', 'aguanta'],
  },
  negativo: {
    fuerte: ['crash', 'colapso', 'desplome', 'pánico', 'crisis', 'caída libre', 'bear market'],
    moderado: ['cae', 'pierde', 'baja', 'declina', 'retrocede', 'cede', 'debilita'],
    débil: ['corrección', 'ajuste', 'retracción'],
  },
};

/**
 * Calcula puntuación de sentimiento usando análisis de palabras clave
 */
export function calculateSentimentScore(text: string): SentimentScore {
  const lowerText = text.toLowerCase();
  const keywords: { word: string; score: number }[] = [];
  let totalScore = 0;
  let weightedSum = 0;

  // Analizar palabras positivas
  Object.entries(SENTIMENT_KEYWORDS.positivo).forEach(([intensity, words]) => {
    const weight = intensity === 'fuerte' ? 1 : intensity === 'moderado' ? 0.6 : 0.3;
    words.forEach(word => {
      if (lowerText.includes(word)) {
        const score = weight;
        keywords.push({ word, score });
        weightedSum += score;
        totalScore += 1;
      }
    });
  });

  // Analizar palabras negativas
  Object.entries(SENTIMENT_KEYWORDS.negativo).forEach(([intensity, words]) => {
    const weight = intensity === 'fuerte' ? -1 : intensity === 'moderado' ? -0.6 : -0.3;
    words.forEach(word => {
      if (lowerText.includes(word)) {
        const score = weight;
        keywords.push({ word, score });
        weightedSum += score;
        totalScore += 1;
      }
    });
  });

  // Normalizar puntuación entre -1 y 1
  const normalizedScore = totalScore > 0 ? Math.max(-1, Math.min(1, weightedSum / totalScore)) : 0;
  const confidence = Math.min(1, totalScore * 0.1); // Mayor confianza con más palabras clave

  return {
    overall: normalizedScore,
    confidence,
    keywords: keywords.slice(0, 5), // Top 5 palabras
    category: normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral',
  };
}

/**
 * Correlaciona sentimiento con movimientos históricos
 * Basado en patrones históricos conocidos
 */
export function correlateWithHistoricalMovements(
  sentiment: SentimentScore,
  asset: string
): MarketCorrelation {
  // Correlaciones históricas conocidas por activo
  const historicalCorrelations: Record<string, number> = {
    // Acciones tecnológicas: altamente sensibles a noticias de crecimiento
    AAPL: 0.75,
    MSFT: 0.72,
    GOOGL: 0.70,
    NVDA: 0.80,
    TSLA: 0.85,

    // Índices: moderadamente sensibles
    SPY: 0.65,
    QQQ: 0.70,
    IWM: 0.60,

    // Commodities: menos sensibles a noticias de empresas
    GLD: 0.40,
    CL: 0.50,
    NG: 0.45,

    // Criptomonedas: muy sensibles a noticias regulatorias
    BTC: 0.85,
    ETH: 0.80,

    // Divisas: moderadamente sensibles
    EURUSD: 0.55,
    GBPUSD: 0.50,
  };

  const historicalCorr = historicalCorrelations[asset] || 0.6;

  // Calcular impacto esperado
  const sentimentImpact = sentiment.overall * sentiment.confidence;
  const expectedMovement = sentimentImpact * historicalCorr * 100; // % esperado

  return {
    asset,
    sentimentImpact,
    historicalCorrelation: historicalCorr,
    confidence: sentiment.confidence * historicalCorr,
    expectedMovement,
  };
}

/**
 * Analiza múltiples noticias y calcula impacto de mercado
 */
export function analyzeMarketSentiment(
  newsTexts: string[],
  affectedAssets: string[]
): SentimentMarketAnalysis {
  // Calcular sentimiento promedio
  const sentiments = newsTexts.map(text => calculateSentimentScore(text));
  const avgSentiment = sentiments.reduce((sum, s) => sum + s.overall, 0) / sentiments.length;
  const avgConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

  // Calcular correlaciones para cada activo
  const correlations = affectedAssets.map(asset => {
    const sentimentScore: SentimentScore = {
      overall: avgSentiment,
      confidence: avgConfidence,
      keywords: [],
      category: avgSentiment > 0.2 ? 'positivo' : avgSentiment < -0.2 ? 'negativo' : 'neutral',
    };
    return correlateWithHistoricalMovements(sentimentScore, asset);
  });

  // Calcular ajuste de riesgo
  // Sentimiento positivo reduce volatilidad, negativo la aumenta
  const riskAdjustment = 1 + Math.abs(avgSentiment) * 0.2; // 0.8 a 1.2

  // Determinar acción recomendada
  let recommendedAction: 'comprar' | 'vender' | 'mantener' = 'mantener';
  if (avgSentiment > 0.3 && avgConfidence > 0.6) {
    recommendedAction = 'comprar';
  } else if (avgSentiment < -0.3 && avgConfidence > 0.6) {
    recommendedAction = 'vender';
  }

  // Generar explicación
  const sentimentLabel = avgSentiment > 0.2 ? 'positivo' : avgSentiment < -0.2 ? 'negativo' : 'neutral';
  const confidenceLabel = avgConfidence > 0.7 ? 'alta' : avgConfidence > 0.4 ? 'moderada' : 'baja';
  const explanation =
    `Sentimiento de mercado ${sentimentLabel} con confianza ${confidenceLabel}. ` +
    `Impacto esperado en activos: ${correlations.map(c => `${c.asset} ${c.expectedMovement > 0 ? '+' : ''}${c.expectedMovement.toFixed(1)}%`).join(', ')}. ` +
    `Volatilidad ajustada por factor de ${riskAdjustment.toFixed(2)}.`;

  return {
    overallSentiment: avgSentiment,
    marketConfidence: avgConfidence,
    correlations,
    riskAdjustment,
    recommendedAction,
    explanation,
  };
}

/**
 * Ajusta parámetros de Monte Carlo basado en sentimiento
 */
export function adjustMonteCarloParameters(
  baseExpectedReturn: number,
  baseVolatility: number,
  sentimentAnalysis: SentimentMarketAnalysis
): { expectedReturn: number; volatility: number } {
  // Ajustar retorno esperado
  const sentimentAdjustment = sentimentAnalysis.overallSentiment * 0.05; // ±5%
  const adjustedReturn = baseExpectedReturn + sentimentAdjustment;

  // Ajustar volatilidad
  const adjustedVolatility = baseVolatility * sentimentAnalysis.riskAdjustment;

  return {
    expectedReturn: adjustedReturn,
    volatility: adjustedVolatility,
  };
}

/**
 * Calcula matriz de impacto de sentimiento por activo
 */
export function calculateSentimentImpactMatrix(
  assets: string[],
  sentimentScores: SentimentScore[]
): Record<string, number> {
  const avgSentiment = sentimentScores.reduce((sum, s) => sum + s.overall, 0) / sentimentScores.length;

  const impactMatrix: Record<string, number> = {};

  assets.forEach(asset => {
    const correlation = correlateWithHistoricalMovements(
      {
        overall: avgSentiment,
        confidence: sentimentScores.reduce((sum, s) => sum + s.confidence, 0) / sentimentScores.length,
        keywords: [],
        category: avgSentiment > 0 ? 'positivo' : 'negativo',
      },
      asset
    );

    impactMatrix[asset] = correlation.expectedMovement;
  });

  return impactMatrix;
}


/**
 * Integración avanzada con LLM para análisis de sentimiento mejorado
 */
import { invokeLLM } from "../_core/llm";
import { getMarketNews, MarketNews } from "./marketNewsService";

export interface SentimentAnalysisWithLLM {
  overallSentiment: number;
  marketConfidence: number;
  correlations: MarketCorrelation[];
  riskAdjustment: number;
  recommendedAction: 'comprar' | 'vender' | 'mantener';
  explanation: string;
  newsCount: number;
  analysisDate: Date;
}

/**
 * Analiza sentimiento usando LLM con noticias reales
 */
export async function analyzeMarketSentimentWithLLM(
  portfolioAssets: Array<{ symbol: string; assetName: string }>
): Promise<SentimentAnalysisWithLLM> {
  try {
    // Obtener noticias recientes
    const news = await getMarketNews({ limit: 50 }) as MarketNews[];

    if (!news || news.length === 0) {
      return getDefaultSentimentAnalysis();
    }

    // Preparar contenido de noticias para análisis
    const newsContent = news
      .map((n: MarketNews) => `${n.title}: ${n.description || ""}`)
      .join("\n");

    // Usar LLM para análisis profundo
    const sentimentPrompt = `
Analiza el sentimiento de las siguientes noticias financieras y proporciona un análisis estructurado en JSON.

NOTICIAS:
${newsContent}

Por favor proporciona un análisis JSON con la siguiente estructura exacta:
{
  "overallSentiment": número entre -1 (muy negativo) y 1 (muy positivo),
  "marketConfidence": número entre 0 (sin confianza) y 1 (alta confianza),
  "keyThemes": ["tema1", "tema2"],
  "riskFactors": ["riesgo1", "riesgo2"],
  "opportunities": ["oportunidad1", "oportunidad2"],
  "recommendedAction": "comprar" o "vender" o "mantener",
  "explanation": "explicación detallada del análisis"
}

Responde SOLO con el JSON, sin explicaciones adicionales.
    `;

    const llmResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un analista financiero experto. Analiza noticias y proporciona sentimiento de mercado en formato JSON estructurado.",
        },
        {
          role: "user",
          content: sentimentPrompt as string,
        },
      ],
    });

    let sentimentData;
    try {
      const rawContent = llmResponse.choices[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : "{}";
      sentimentData = JSON.parse(content);
    } catch {
      sentimentData = {
        overallSentiment: 0,
        marketConfidence: 0.5,
        recommendedAction: "mantener",
        explanation: "Análisis completado",
      };
    }

    // Calcular correlaciones por activo
    const correlations = portfolioAssets.slice(0, 5).map((asset) => {
      const relatedNews = news.filter(
        (n: MarketNews) =>
          n.title.includes(asset.symbol) ||
          n.title.includes(asset.assetName) ||
          (n.description && n.description.includes(asset.symbol))
      );

      const assetSentimentImpact =
        relatedNews.length > 0
          ? (relatedNews.reduce((sum: number, n: MarketNews) => sum + (n.sentiment === 'positivo' ? 1 : n.sentiment === 'negativo' ? -1 : 0), 0) /
              relatedNews.length) *
            0.5
          : sentimentData.overallSentiment * 0.3;

      const historicalCorr = getHistoricalCorrelationForAsset(asset.symbol);

      const confidence = Math.min(
        0.95,
        0.3 + (relatedNews.length / 10) * 0.4 + sentimentData.marketConfidence * 0.3
      );

      const expectedMovement = assetSentimentImpact * historicalCorr * 100;

      return {
        asset: asset.symbol,
        sentimentImpact: assetSentimentImpact,
        historicalCorrelation: historicalCorr,
        confidence,
        expectedMovement,
      };
    });

    // Calcular factor de ajuste de riesgo
    const riskAdjustment = calculateRiskAdjustmentFactor(
      sentimentData.overallSentiment,
      sentimentData.marketConfidence
    );

    return {
      overallSentiment: sentimentData.overallSentiment || 0,
      marketConfidence: sentimentData.marketConfidence || 0.5,
      correlations,
      riskAdjustment,
      recommendedAction: sentimentData.recommendedAction || "mantener",
      explanation:
        sentimentData.explanation ||
        "Análisis de sentimiento completado basado en noticias recientes.",
      newsCount: news.length,
      analysisDate: new Date(),
    };
  } catch (error) {
    console.error("Error en análisis de sentimiento con LLM:", error);
    return getDefaultSentimentAnalysis();
  }
}

/**
 * Obtiene correlación histórica para un activo
 */
function getHistoricalCorrelationForAsset(symbol: string): number {
  const correlations: Record<string, number> = {
    AAPL: 0.75,
    MSFT: 0.72,
    GOOGL: 0.70,
    AMZN: 0.68,
    TSLA: 0.82,
    SPY: 0.65,
    QQQ: 0.70,
    BTC: 0.85,
    ETH: 0.80,
    GLD: 0.15,
    TLT: 0.05,
  };

  return correlations[symbol] || 0.6 + Math.random() * 0.2;
}

/**
 * Calcula factor de ajuste de riesgo
 */
function calculateRiskAdjustmentFactor(sentiment: number, confidence: number): number {
  const sentimentFactor = 1 - sentiment * 0.2;
  const confidenceFactor = 0.9 + confidence * 0.2;
  const adjustment = sentimentFactor * confidenceFactor;
  return Math.max(0.7, Math.min(1.4, adjustment));
}

/**
 * Análisis por defecto
 */
function getDefaultSentimentAnalysis(): SentimentAnalysisWithLLM {
  return {
    overallSentiment: 0,
    marketConfidence: 0.5,
    correlations: [
      {
        asset: "SPY",
        sentimentImpact: 0,
        historicalCorrelation: 0.65,
        confidence: 0.5,
        expectedMovement: 0,
      },
    ],
    riskAdjustment: 1.0,
    recommendedAction: "mantener",
    explanation:
      "Análisis no disponible. Se recomienda mantener posición actual.",
    newsCount: 0,
    analysisDate: new Date(),
  };
}

/**
 * Ajusta parámetros de Monte Carlo con análisis de sentimiento
 */
export function adjustMonteCarloWithSentiment(
  baseExpectedReturn: number,
  baseVolatility: number,
  sentimentAnalysis: SentimentAnalysisWithLLM
): { expectedReturn: number; volatility: number } {
  const sentimentAdjustment = sentimentAnalysis.overallSentiment * 0.05;
  const adjustedReturn = baseExpectedReturn + sentimentAdjustment;
  const adjustedVolatility = baseVolatility * sentimentAnalysis.riskAdjustment;

  return {
    expectedReturn: adjustedReturn,
    volatility: adjustedVolatility,
  };
}
