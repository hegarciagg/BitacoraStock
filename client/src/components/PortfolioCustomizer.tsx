import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface CustomAsset {
  symbol: string;
  weight: number;
  expectedReturn: number;
  volatility: number;
}

interface PortfolioCustomizerProps {
  initialAssets?: CustomAsset[];
  onAssetChange: (assets: CustomAsset[]) => void;
}

export function PortfolioCustomizer({
  initialAssets = [
    { symbol: "STOCKS", weight: 0.6, expectedReturn: 0.08, volatility: 0.18 },
    { symbol: "BONDS", weight: 0.4, expectedReturn: 0.03, volatility: 0.05 },
  ],
  onAssetChange,
}: PortfolioCustomizerProps) {
  const [assets, setAssets] = useState<CustomAsset[]>(initialAssets);
  const [newAssetSymbol, setNewAssetSymbol] = useState("");

  // Validar que los pesos sumen 100%
  const totalWeight = assets.reduce((sum, asset) => sum + asset.weight, 0);
  const isValidPortfolio = Math.abs(totalWeight - 1.0) < 0.001;

  useEffect(() => {
    onAssetChange(assets);
  }, [assets]);

  const handleWeightChange = (index: number, newWeight: number) => {
    const updatedAssets = [...assets];
    updatedAssets[index].weight = newWeight;
    setAssets(updatedAssets);
  };

  const handleReturnChange = (index: number, value: string) => {
    const updatedAssets = [...assets];
    updatedAssets[index].expectedReturn = parseFloat(value) / 100;
    setAssets(updatedAssets);
  };

  const handleVolatilityChange = (index: number, value: string) => {
    const updatedAssets = [...assets];
    updatedAssets[index].volatility = parseFloat(value) / 100;
    setAssets(updatedAssets);
  };

  const handleAddAsset = () => {
    if (!newAssetSymbol.trim()) {
      toast.error("Ingresa un símbolo de activo");
      return;
    }

    if (assets.some((a) => a.symbol.toUpperCase() === newAssetSymbol.toUpperCase())) {
      toast.error("Este activo ya existe");
      return;
    }

    const newAsset: CustomAsset = {
      symbol: newAssetSymbol.toUpperCase(),
      weight: 0.1,
      expectedReturn: 0.05,
      volatility: 0.15,
    };

    setAssets([...assets, newAsset]);
    setNewAssetSymbol("");
    toast.success("Activo agregado");
  };

  const handleRemoveAsset = (index: number) => {
    if (assets.length <= 1) {
      toast.error("Debe haber al menos un activo");
      return;
    }
    const updatedAssets = assets.filter((_, i) => i !== index);
    setAssets(updatedAssets);
  };

  const handleNormalizeWeights = () => {
    if (assets.length === 0) return;

    const normalized = assets.map((asset) => ({
      ...asset,
      weight: 1 / assets.length,
    }));

    setAssets(normalized);
    toast.success("Pesos normalizados equitativamente");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Personalizar Portafolio</CardTitle>
          <CardDescription className="text-slate-400">
            Ajusta la composición, retornos esperados y volatilidades de los activos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activos existentes */}
          <div className="space-y-4">
            {assets.map((asset, index) => (
              <div key={index} className="p-4 bg-slate-700 rounded-lg border border-slate-600 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold">{asset.symbol}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAsset(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Peso del activo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Peso en el Portafolio</Label>
                    <span className="text-white font-semibold">{(asset.weight * 100).toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[asset.weight * 100]}
                    onValueChange={(value) => handleWeightChange(index, value[0] / 100)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Retorno esperado */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Retorno Esperado Anual (%)</Label>
                  <Input
                    type="number"
                    value={(asset.expectedReturn * 100).toFixed(2)}
                    onChange={(e) => handleReturnChange(index, e.target.value)}
                    step={0.1}
                    min={-50}
                    max={100}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Retorno promedio esperado del activo en un año
                  </p>
                </div>

                {/* Volatilidad */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Volatilidad Anual (%)</Label>
                  <Input
                    type="number"
                    value={(asset.volatility * 100).toFixed(2)}
                    onChange={(e) => handleVolatilityChange(index, e.target.value)}
                    step={0.1}
                    min={0}
                    max={200}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Medida de riesgo o variabilidad del activo
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Agregar nuevo activo */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600 space-y-3">
            <Label className="text-white">Agregar Nuevo Activo</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: AAPL, BTC, EUR"
                value={newAssetSymbol}
                onChange={(e) => setNewAssetSymbol(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddAsset()}
                className="bg-slate-600 border-slate-500 text-white placeholder-slate-400"
              />
              <Button
                onClick={handleAddAsset}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Resumen y acciones */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Peso Total:</span>
              <span className={`font-semibold ${isValidPortfolio ? "text-green-400" : "text-red-400"}`}>
                {(totalWeight * 100).toFixed(1)}%
              </span>
            </div>
            {!isValidPortfolio && (
              <p className="text-sm text-red-400">
                Los pesos deben sumar 100%. Diferencia: {((1 - totalWeight) * 100).toFixed(1)}%
              </p>
            )}
            <Button
              onClick={handleNormalizeWeights}
              variant="outline"
              className="w-full border-slate-500 text-slate-300 hover:bg-slate-600"
            >
              Normalizar Pesos Equitativamente
            </Button>
          </div>

          {/* Información educativa */}
          <div className="p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700 space-y-2">
            <h4 className="text-primary font-semibold">Consejos para Personalizar</h4>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>Los pesos deben sumar 100% para una simulación válida</li>
              <li>Retorno esperado: histórico promedio del activo (ej: acciones 8%, bonos 3%)</li>
              <li>Volatilidad: desviación estándar histórica (ej: acciones 18%, bonos 5%)</li>
              <li>Usa "Normalizar" para distribuir pesos equitativamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
