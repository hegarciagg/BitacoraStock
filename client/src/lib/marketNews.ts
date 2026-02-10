/**
 * Helper para obtener noticias del mercado en el cliente
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
  relevance: number;
  affectedAssets?: string[];
}

/**
 * Obtiene noticias del mercado (simuladas por ahora)
 * En producción, esto llamaría a un endpoint que usa NewsAPI
 */
export function getMarketNews(): MarketNews[] {
  return [
    {
      id: '1',
      title: 'Mercados alcistas tras anuncio de política monetaria',
      description: 'Los índices principales suben tras el anuncio de la Fed sobre tasas de interés',
      source: 'Reuters',
      url: 'https://reuters.com',
      category: 'mercado',
      sentiment: 'positivo',
      relevance: 95,
      publishedAt: new Date(Date.now() - 1000 * 60 * 30), // hace 30 minutos
      affectedAssets: ['SPY', 'QQQ', 'IWM'],
    },
    {
      id: '2',
      title: 'Sector tecnológico en caída por preocupaciones de inflación',
      description: 'Las acciones tecnológicas retroceden ante datos de inflación más altos de lo esperado',
      source: 'Bloomberg',
      url: 'https://bloomberg.com',
      category: 'tecnologia',
      sentiment: 'negativo',
      relevance: 88,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60), // hace 1 hora
      affectedAssets: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'],
    },
    {
      id: '3',
      title: 'Petróleo sube por tensiones geopolíticas',
      description: 'Los precios del petróleo crudo alcanzan máximos de 3 meses',
      source: 'CNBC',
      url: 'https://cnbc.com',
      category: 'commodities',
      sentiment: 'neutral',
      relevance: 75,
      publishedAt: new Date(Date.now() - 1000 * 60 * 120), // hace 2 horas
      affectedAssets: ['XLE', 'CL'],
    },
    {
      id: '4',
      title: 'Bitcoin recupera terreno tras aprobación de ETF',
      description: 'Criptomonedas repuntan tras noticias positivas sobre regulación',
      source: 'CoinDesk',
      url: 'https://coindesk.com',
      category: 'criptomonedas',
      sentiment: 'positivo',
      relevance: 82,
      publishedAt: new Date(Date.now() - 1000 * 60 * 180), // hace 3 horas
      affectedAssets: ['BTC', 'ETH'],
    },
    {
      id: '5',
      title: 'Dólar se fortalece ante debilidad del euro',
      description: 'El índice del dólar alcanza nuevos máximos en el año',
      source: 'MarketWatch',
      url: 'https://marketwatch.com',
      category: 'divisas',
      sentiment: 'positivo',
      relevance: 70,
      publishedAt: new Date(Date.now() - 1000 * 60 * 240), // hace 4 horas
      affectedAssets: ['DXY', 'EURUSD'],
    },
  ];
}

/**
 * Filtra noticias por categoría
 */
export function filterNewsByCategory(news: MarketNews[], category: string): MarketNews[] {
  return news.filter(n => n.category === category);
}

/**
 * Filtra noticias por sentimiento
 */
export function filterNewsBySentiment(news: MarketNews[], sentiment: 'positivo' | 'negativo' | 'neutral'): MarketNews[] {
  return news.filter(n => n.sentiment === sentiment);
}

/**
 * Ordena noticias por relevancia
 */
export function sortNewsByRelevance(news: MarketNews[]): MarketNews[] {
  return [...news].sort((a, b) => b.relevance - a.relevance);
}

/**
 * Ordena noticias por fecha
 */
export function sortNewsByDate(news: MarketNews[]): MarketNews[] {
  return [...news].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/**
 * Obtiene noticias que afectan un activo específico
 */
export function getNewsForAsset(news: MarketNews[], asset: string): MarketNews[] {
  return news.filter(n => n.affectedAssets?.includes(asset.toUpperCase()));
}
