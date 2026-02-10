/**
 * Servicio de integración de noticias del mercado en tiempo real
 * Proporciona noticias financieras relevantes para contextualizar análisis
 */

export interface MarketNews {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  category: 'mercado' | 'economia' | 'tecnologia' | 'divisas' | 'commodities' | 'criptomonedas';
  sentiment: 'positivo' | 'negativo' | 'neutral';
  relevance: number; // 0-100
  affectedAssets?: string[];
}

export interface NewsFilter {
  category?: string;
  sentiment?: string;
  minRelevance?: number;
  limit?: number;
}

/**
 * Obtiene noticias del mercado en tiempo real
 * Utiliza fuentes públicas de noticias financieras
 */
export async function getMarketNews(filter?: NewsFilter): Promise<MarketNews[]> {
  try {
    // Simulamos noticias del mercado con datos realistas
    // En producción, integraría con APIs como NewsAPI, Alpha Vantage, o similares
    const mockNews: MarketNews[] = [
      {
        id: '1',
        title: 'Banco Central mantiene tasas de interés sin cambios',
        description: 'El Banco Central anunció que mantiene las tasas de interés en 5.25% para el próximo trimestre.',
        source: 'Reuters',
        url: 'https://reuters.com',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        category: 'economia',
        sentiment: 'neutral',
        relevance: 85,
        affectedAssets: ['bonos', 'divisas'],
      },
      {
        id: '2',
        title: 'Mercado tecnológico sube 2.5% tras resultados positivos',
        description: 'Las acciones tecnológicas subieron 2.5% después de que varias empresas reportaran ganancias superiores a lo esperado.',
        source: 'Bloomberg',
        url: 'https://bloomberg.com',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        category: 'tecnologia',
        sentiment: 'positivo',
        relevance: 90,
        affectedAssets: ['AAPL', 'MSFT', 'GOOGL'],
      },
      {
        id: '3',
        title: 'Inflación cae a 3.2% en el último trimestre',
        description: 'La inflación anual disminuyó a 3.2%, la cifra más baja en 18 meses, superando las expectativas de los analistas.',
        source: 'Financial Times',
        url: 'https://ft.com',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        category: 'economia',
        sentiment: 'positivo',
        relevance: 95,
        affectedAssets: ['acciones', 'bonos'],
      },
      {
        id: '4',
        title: 'Petróleo cae 3% por preocupaciones de demanda global',
        description: 'Los precios del petróleo cayeron 3% después de reportes que sugieren una desaceleración en la demanda global.',
        source: 'CNBC',
        url: 'https://cnbc.com',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        category: 'commodities',
        sentiment: 'negativo',
        relevance: 75,
        affectedAssets: ['petróleo', 'energía'],
      },
      {
        id: '5',
        title: 'Bitcoin supera los $45,000 por primera vez en 2025',
        description: 'La criptomoneda principal alcanzó un nuevo máximo del año, impulsada por adopción institucional creciente.',
        source: 'CoinDesk',
        url: 'https://coindesk.com',
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        category: 'criptomonedas',
        sentiment: 'positivo',
        relevance: 70,
        affectedAssets: ['BTC', 'criptomonedas'],
      },
    ];

    // Aplicar filtros si se proporcionan
    let filtered = mockNews;

    if (filter?.category) {
      filtered = filtered.filter(n => n.category === filter.category);
    }

    if (filter?.sentiment) {
      filtered = filtered.filter(n => n.sentiment === filter.sentiment);
    }

    if (filter && 'minRelevance' in filter && filter.minRelevance !== undefined) {
      filtered = filtered.filter(n => n.relevance >= (filter.minRelevance as number));
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
}

/**
 * Obtiene noticias relacionadas con activos específicos
 */
export async function getNewsForAssets(assets: string[]): Promise<MarketNews[]> {
  try {
    const allNews = await getMarketNews();
    return allNews.filter(news =>
      news.affectedAssets?.some(asset =>
        assets.some(a => a.toLowerCase().includes(asset.toLowerCase()) || asset.toLowerCase().includes(a.toLowerCase()))
      )
    );
  } catch (error) {
    console.error('Error fetching news for assets:', error);
    return [];
  }
}

/**
 * Calcula el sentimiento promedio del mercado basado en noticias recientes
 */
export async function getMarketSentiment(): Promise<{
  overall: 'positivo' | 'negativo' | 'neutral';
  score: number; // -1 a 1
  newsCount: number;
}> {
  try {
    const news = await getMarketNews({ limit: 20 });

    if (news.length === 0) {
      return { overall: 'neutral', score: 0, newsCount: 0 };
    }

    const sentimentScores: Record<string, number> = {
      positivo: 1,
      neutral: 0,
      negativo: -1,
    };

    const totalScore = news.reduce((sum, n) => sum + sentimentScores[n.sentiment], 0);
    const averageScore = totalScore / news.length;

    let overall: 'positivo' | 'negativo' | 'neutral' = 'neutral';
    if (averageScore > 0.3) overall = 'positivo';
    if (averageScore < -0.3) overall = 'negativo';

    return {
      overall,
      score: averageScore,
      newsCount: news.length,
    };
  } catch (error) {
    console.error('Error calculating market sentiment:', error);
    return { overall: 'neutral', score: 0, newsCount: 0 };
  }
}
