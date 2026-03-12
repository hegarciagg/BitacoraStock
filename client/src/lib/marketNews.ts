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
 * Obtiene noticias del mercado desde CryptoPanic
 */
export async function getMarketNews(): Promise<MarketNews[]> {
  try {
    const response = await fetch('/api/cryptopanic/news?currencies=BTC,ETH,SOL');
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any): MarketNews => {
      // Determinar sentimiento basado en votos
      let sentiment: 'positivo' | 'negativo' | 'neutral' = 'neutral';
      if (item.votes) {
        if (item.votes.positive > item.votes.negative * 1.5 || item.votes.important > 5) {
          if (item.votes.negative === 0 && item.votes.positive > 0) sentiment = 'positivo';
          else if (item.votes.positive > item.votes.negative) sentiment = 'positivo';
        } else if (item.votes.negative > item.votes.positive * 1.5 || item.votes.toxic > 5) {
          sentiment = 'negativo';
        }
      }

      // Determinar categoría a grosso modo basándonos en la fuente o moneda
      let category: MarketNews['category'] = 'criptomonedas';
      if (item.source?.domain?.includes('wsj') || item.source?.domain?.includes('bloomberg')) {
        category = 'mercado';
      }

      // Assets afectados
      const affectedAssets = item.currencies ? item.currencies.map((c: any) => c.code) : [];

      return {
        id: item.id?.toString() || Math.random().toString(36).substring(7),
        title: item.title || 'Noticia sin título',
        description: item.description || 'Sin descripción',
        source: item.source?.title || 'CryptoPanic',
        url: item.url || item.original_url || `https://cryptopanic.com/news?search=${encodeURIComponent(item.title)}`,
        publishedAt: item.published_at ? new Date(item.published_at) : new Date(),
        category,
        sentiment,
        relevance: item.panic_score || Math.floor(Math.random() * 40 + 60), 
        affectedAssets,
      };
    });
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
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
