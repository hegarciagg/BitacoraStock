import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface Portfolio {
  id: number;
  name: string;
  description?: string;
}

interface PortfolioSelectorProps {
  allPortfolios: Portfolio[];
  selectedPortfolios: Portfolio[];
  onAdd: (portfolio: Portfolio) => void;
  onRemove: (portfolioId: number) => void;
  maxPortfolios?: number;
}

export function PortfolioSelector({
  allPortfolios,
  selectedPortfolios,
  onAdd,
  onRemove,
  maxPortfolios = 4,
}: PortfolioSelectorProps) {
  const availablePortfolios = allPortfolios.filter(
    (p) => !selectedPortfolios.some((sp) => sp.id === p.id)
  );

  const canAddMore = selectedPortfolios.length < maxPortfolios;

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Portafolios Seleccionados</CardTitle>
        <CardDescription className="text-slate-500">
          Selecciona {maxPortfolios} portafolios como máximo para comparar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portafolios Seleccionados */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">
            Comparando ({selectedPortfolios.length}/{maxPortfolios})
          </h4>
          {selectedPortfolios.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedPortfolios.map((portfolio) => (
                <Badge
                  key={portfolio.id}
                  variant="secondary"
                  className="bg-primary/20 text-primary px-3 py-2 flex items-center gap-2"
                >
                  <span>{portfolio.name}</span>
                  <button
                    onClick={() => onRemove(portfolio.id)}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Selecciona portafolios para comenzar la comparación
            </p>
          )}
        </div>

        {/* Portafolios Disponibles */}
        {canAddMore && availablePortfolios.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700">
              Portafolios Disponibles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availablePortfolios.map((portfolio) => (
                <button
                  key={portfolio.id}
                  onClick={() => onAdd(portfolio)}
                  className="text-left p-3 rounded-lg bg-slate-100 hover:bg-slate-600 transition-colors border border-slate-300 hover:border-blue-500"
                >
                  <div className="font-medium text-slate-900 text-sm">
                    {portfolio.name}
                  </div>
                  {portfolio.description && (
                    <div className="text-xs text-slate-500 mt-1">
                      {portfolio.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay más portafolios disponibles */}
        {!canAddMore && availablePortfolios.length > 0 && (
          <div className="p-3 rounded-lg bg-yellow-900 bg-opacity-30 border border-yellow-700 text-yellow-200 text-sm">
            <p>Has alcanzado el máximo de {maxPortfolios} portafolios para comparar.</p>
          </div>
        )}

        {/* Mensaje cuando no hay portafolios disponibles */}
        {availablePortfolios.length === 0 && selectedPortfolios.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-sm">
            <p>No hay más portafolios disponibles para agregar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
