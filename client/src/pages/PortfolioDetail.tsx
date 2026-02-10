import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, ArrowLeft, TrendingUp, AlertCircle, BarChart3, TrendingUp as TrendingUpIcon, Clock, Zap } from "lucide-react";
import { useState } from "react";
import { PortfolioHistoryTimeline } from "@/components/PortfolioHistoryTimeline";
import { EvolutionChart } from "@/components/EvolutionChart";
import { ExportHistoryButtons } from "@/components/ExportHistoryButtons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function PortfolioDetail() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [, navigate] = useLocation();
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    assetName: "",
    assetType: "stock" as const,
    action: "buy" as const,
    quantity: "",
    unitPrice: "",
    commission: "0",
    transactionDate: new Date().toISOString().split("T")[0],
    comments: "",
  });

  const portfolioId_num = parseInt(portfolioId || "0", 10);

  const portfolio = trpc.portfolio.get.useQuery({ portfolioId: portfolioId_num });
  const investments = trpc.investment.list.useQuery({ portfolioId: portfolioId_num });
  const portfolioHistory = trpc.portfolio.getHistory.useQuery({ portfolioId: portfolioId_num });
  const createInvestment = trpc.investment.create.useMutation({
    onSuccess: () => {
      investments.refetch();
      setFormData({
        symbol: "",
        assetName: "",
        assetType: "stock",
        action: "buy",
        quantity: "",
        unitPrice: "",
        commission: "0",
        transactionDate: new Date().toISOString().split("T")[0],
        comments: "",
      });
      setIsAddingInvestment(false);
    },
  });

  const handleAddInvestment = async () => {
    const totalValue = (parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toString();
    await createInvestment.mutateAsync({
      portfolioId: portfolioId_num,
      symbol: formData.symbol,
      assetName: formData.assetName,
      assetType: formData.assetType,
      action: formData.action,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      totalValue,
      commission: formData.commission || "0",
      transactionDate: new Date(formData.transactionDate),
      comments: formData.comments || undefined,
    });
  };

  if (portfolio.isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-400">Cargando portafolio...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!portfolio.data) {
    return (
      <DashboardLayout>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Portafolio no encontrado</h3>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="border-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{portfolio.data.name}</h1>
              <p className="text-slate-400 mt-2">{portfolio.data.description || "Sin descripción"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/simulation`)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Análisis Monte Carlo
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/recommendations`)}
              className="bg-green-600 hover:bg-green-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Recomendaciones
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/diversification`)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <TrendingUpIcon className="w-4 h-4 mr-2" />
              Diversificación
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/history`)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Historial
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/scenarios`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Escenarios
            </Button>
            <Dialog open={isAddingInvestment} onOpenChange={setIsAddingInvestment}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Inversión
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Agregar Nueva Inversión</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Registra una nueva operación de inversión en tu portafolio.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Símbolo</Label>
                  <Input
                    placeholder="AAPL"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Nombre del Activo</Label>
                  <Input
                    placeholder="Apple Inc."
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Tipo de Activo</Label>
                  <Select value={formData.assetType} onValueChange={(value: any) => setFormData({ ...formData, assetType: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="stock">Acción</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="bond">Bono</SelectItem>
                      <SelectItem value="crypto">Criptomoneda</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Tipo de Acción</Label>
                  <Select value={formData.action} onValueChange={(value: any) => setFormData({ ...formData, action: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="buy">Compra</SelectItem>
                      <SelectItem value="sell">Venta</SelectItem>
                      <SelectItem value="dividend">Dividendo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Precio Unitario</Label>
                  <Input
                    type="number"
                    placeholder="150.50"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Comisión</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Fecha de Transacción</Label>
                  <Input
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-white">Comentarios (opcional)</Label>
                  <Textarea
                    placeholder="Notas sobre esta inversión..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddInvestment}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!formData.symbol || !formData.quantity || !formData.unitPrice || createInvestment.isPending}
              >
                {createInvestment.isPending ? "Agregando..." : "Agregar Inversión"}
              </Button>
              </DialogContent>
            </Dialog>
          </div>
          </div>

        {investments.isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Cargando inversiones...</p>
          </div>
        ) : investments.data && investments.data.length > 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Operaciones de Inversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300">Símbolo</th>
                      <th className="text-left py-3 px-4 text-slate-300">Tipo</th>
                      <th className="text-left py-3 px-4 text-slate-300">Acción</th>
                      <th className="text-right py-3 px-4 text-slate-300">Cantidad</th>
                      <th className="text-right py-3 px-4 text-slate-300">Precio</th>
                      <th className="text-right py-3 px-4 text-slate-300">Total</th>
                      <th className="text-left py-3 px-4 text-slate-300">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.data.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-4 text-white font-semibold">{inv.symbol}</td>
                        <td className="py-3 px-4 text-slate-300">{inv.assetType}</td>
                        <td className="py-3 px-4">
                          <span className={inv.action === "buy" ? "text-green-400" : inv.action === "sell" ? "text-red-400" : "text-blue-400"}>
                            {inv.action === "buy" ? "Compra" : inv.action === "sell" ? "Venta" : "Dividendo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">{parseFloat(inv.quantity.toString()).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-slate-300">${parseFloat(inv.unitPrice.toString()).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-white font-semibold">${parseFloat(inv.totalValue.toString()).toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-300">{new Date(inv.transactionDate).toLocaleDateString("es-ES")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay inversiones</h3>
              <p className="text-slate-400 mb-6">Comienza a registrar tus operaciones de inversión.</p>
              <Button
                onClick={() => setIsAddingInvestment(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Inversión
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Sección de Historial */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Historial y Evolución
            </h2>
            <ExportHistoryButtons portfolioId={portfolioId_num} />
          </div>
          
          <EvolutionChart 
            history={portfolioHistory.data || []} 
            isLoading={portfolioHistory.isLoading}
          />
          
          <PortfolioHistoryTimeline 
            history={portfolioHistory.data || []} 
            isLoading={portfolioHistory.isLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
