import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, Zap } from "lucide-react";

export interface MarketNews {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  category: "mercado" | "economia" | "tecnologia" | "divisas" | "commodities" | "criptomonedas";
  sentiment: "positivo" | "negativo" | "neutral";
  relevance: number;
  affectedAssets?: string[];
}

interface MarketNewsFeedProps {
  news?: MarketNews[];
  isLoading?: boolean;
  limit?: number;
}

const categoryLabels: Record<string, string> = {
  mercado: "Mercado",
  economia: "Economía",
  tecnologia: "Tecnología",
  divisas: "Divisas",
  commodities: "Commodities",
  criptomonedas: "Criptomonedas",
};

const categoryColors: Record<string, string> = {
  mercado: "bg-blue-500/20 text-primary",
  economia: "bg-purple-500/20 text-purple-300",
  tecnologia: "bg-cyan-500/20 text-cyan-300",
  divisas: "bg-green-500/20 text-green-300",
  commodities: "bg-orange-500/20 text-orange-300",
  criptomonedas: "bg-yellow-500/20 text-yellow-300",
};

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case "positivo":
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    case "negativo":
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    default:
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours > 0) return `hace ${hours}h`;
  if (minutes > 0) return `hace ${minutes}m`;
  return "hace poco";
}

export default function MarketNewsFeed({ news = [], isLoading = false, limit = 5 }: MarketNewsFeedProps) {
  const displayNews = news.slice(0, limit);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Noticias del Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayNews.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Noticias del Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">No hay noticias disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Noticias del Mercado
        </CardTitle>
        <CardDescription className="text-slate-500">
          Últimas noticias financieras relevantes para tu portafolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayNews.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getSentimentIcon(item.sentiment)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{formatTime(item.publishedAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${categoryColors[item.category]}`}>
                      {categoryLabels[item.category]}
                    </Badge>
                    <span className="text-xs text-slate-500">{item.source}</span>
                    <div className="ml-auto text-xs text-slate-500">
                      Relevancia: {item.relevance}%
                    </div>
                  </div>
                  {item.affectedAssets && item.affectedAssets.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {item.affectedAssets.slice(0, 3).map((asset) => (
                        <span key={asset} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                          {asset}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
