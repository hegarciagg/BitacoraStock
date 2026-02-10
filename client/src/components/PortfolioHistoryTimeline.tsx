import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Minus, Edit, TrendingUp } from "lucide-react";

interface HistoryEntry {
  id: number;
  portfolioId: number;
  userId: number;
  changeType: "created" | "updated" | "asset_added" | "asset_removed" | "asset_modified" | "rebalanced" | "deleted";
  description: string | null;
  previousValue: string | null;
  newValue: string | null;
  metadata: string | null;
  createdAt: Date;
}

interface PortfolioHistoryTimelineProps {
  history: HistoryEntry[];
  isLoading?: boolean;
}

const changeTypeConfig = {
  created: { icon: Plus, color: "bg-green-500", label: "Portafolio Creado" },
  updated: { icon: Edit, color: "bg-blue-500", label: "Portafolio Actualizado" },
  asset_added: { icon: Plus, color: "bg-emerald-500", label: "Activo Agregado" },
  asset_removed: { icon: Minus, color: "bg-red-500", label: "Activo Removido" },
  asset_modified: { icon: Edit, color: "bg-amber-500", label: "Activo Modificado" },
  rebalanced: { icon: TrendingUp, color: "bg-purple-500", label: "Rebalanceado" },
  deleted: { icon: Minus, color: "bg-red-600", label: "Portafolio Eliminado" },
};

export function PortfolioHistoryTimeline({ history, isLoading }: PortfolioHistoryTimelineProps) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-12 text-center">
          <p className="text-slate-400">Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-12 text-center">
          <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No hay cambios registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Historial de Cambios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {history.map((entry, index) => {
            const config = changeTypeConfig[entry.changeType];
            const Icon = config.icon;
            const prevValue = entry.previousValue ? parseFloat(entry.previousValue) : null;
            const newValue = entry.newValue ? parseFloat(entry.newValue) : null;
            const change = prevValue && newValue ? newValue - prevValue : null;

            return (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`${config.color} p-2 rounded-full text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < history.length - 1 && (
                    <div className="w-0.5 h-12 bg-slate-600 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="mb-2" variant="secondary">
                        {config.label}
                      </Badge>
                      {entry.description && (
                        <p className="text-white text-sm font-medium">{entry.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.createdAt).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Value changes */}
                  {prevValue !== null && newValue !== null && (
                    <div className="mt-2 text-sm text-slate-300">
                      <span>Valor anterior: </span>
                      <span className="text-slate-200 font-medium">
                        ${prevValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                      </span>
                      <span className="mx-2">→</span>
                      <span>Valor nuevo: </span>
                      <span className="text-slate-200 font-medium">
                        ${newValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                      </span>
                      {change !== null && (
                        <span className={`ml-2 font-semibold ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          ({change >= 0 ? "+" : ""}{change.toLocaleString("es-ES", { maximumFractionDigits: 2 })})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  {entry.metadata && (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-700 p-2 rounded">
                      {(() => {
                        try {
                          const meta = JSON.parse(entry.metadata);
                          return Object.entries(meta)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" • ");
                        } catch {
                          return entry.metadata;
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
