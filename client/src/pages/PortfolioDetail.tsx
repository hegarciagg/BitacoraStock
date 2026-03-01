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
import { InvestmentCommentsDialog } from "@/components/InvestmentCommentsDialog";
import { MessageSquare } from "lucide-react";

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
    purchaseReason: "",
  });

  const [commentsDialog, setCommentsDialog] = useState<{ open: boolean; investmentId: number; symbol: string }>({
    open: false,
    investmentId: 0,
    symbol: "",
  });

  const portfolioId_num = parseInt(portfolioId || "0", 10);

  const portfolio = trpc.portfolio.get.useQuery({ portfolioId: portfolioId_num });
  const investments = trpc.investment.list.useQuery({ portfolioId: portfolioId_num });
  const portfolioHistory = trpc.portfolio.getHistory.useQuery({ portfolioId: portfolioId_num });
  
  const uniqueSymbols = Array.from(new Set(investments.data?.map((i) => i.symbol) || []));
  const pricesQuery = trpc.market.getPrices.useQuery(
    { symbols: uniqueSymbols },
    { enabled: uniqueSymbols.length > 0, refetchInterval: 60000 }
  );

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
        purchaseReason: "",
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
      purchaseReason: formData.purchaseReason || undefined,
    });
  };

  if (portfolio.isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Cargando portafolio...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!portfolio.data) {
    return (
      <DashboardLayout>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Portafolio no encontrado</h3>
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
              className="border-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{portfolio.data.name}</h1>
              <p className="text-slate-500 mt-2">{portfolio.data.description || "Sin descripción"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/simulation`)}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Análisis Monte Carlo
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/recommendations`)}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Recomendaciones
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/diversification`)}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <TrendingUpIcon className="w-4 h-4 mr-2" />
              Diversificación
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/history`)}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Clock className="w-4 h-4 mr-2" />
              Historial
            </Button>
            <Button
              onClick={() => navigate(`/portfolio/${portfolioId}/scenarios`)}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Zap className="w-4 h-4 mr-2" />
              Escenarios
            </Button>
            <Dialog open={isAddingInvestment} onOpenChange={setIsAddingInvestment}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Inversión
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white shadow-sm border-slate-200 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Agregar Nueva Inversión</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Registra una nueva operación de inversión en tu portafolio.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-900">Símbolo</Label>
                  <Input
                    placeholder="AAPL"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-900">Nombre del Activo</Label>
                  <Input
                    placeholder="Apple Inc."
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-900">Tipo de Activo</Label>
                  <Select value={formData.assetType} onValueChange={(value: any) => setFormData({ ...formData, assetType: value })}>
                    <SelectTrigger className="bg-slate-100 border-slate-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-100 border-slate-300">
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
                  <Label className="text-slate-900">Tipo de Acción</Label>
                  <Select value={formData.action} onValueChange={(value: any) => setFormData({ ...formData, action: value })}>
                    <SelectTrigger className="bg-slate-100 border-slate-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-100 border-slate-300">
                      <SelectItem value="buy">Compra</SelectItem>
                      <SelectItem value="sell">Venta</SelectItem>
                      <SelectItem value="dividend">Dividendo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-900">Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-900">Precio Unitario</Label>
                  <Input
                    type="number"
                    placeholder="150.50"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-900">Comisión</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-900">Fecha de Transacción</Label>
                  <Input
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-900">Comentarios (opcional)</Label>
                  <Textarea
                    placeholder="Notas sobre esta inversión..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-900">Motivo de Compra (opcional)</Label>
                  <Textarea
                    placeholder="¿Por qué compraste este activo? Estrategia, análisis..."
                    value={formData.purchaseReason}
                    onChange={(e) => setFormData({ ...formData, purchaseReason: e.target.value })}
                    className="bg-slate-100 border-slate-300 text-slate-900"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddInvestment}
                className="w-full bg-primary hover:bg-primary/90"
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
            <p className="text-slate-500">Cargando inversiones...</p>
          </div>
        ) : investments.data && investments.data.length > 0 ? (
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Operaciones de Inversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-slate-700">Símbolo</th>
                      <th className="text-left py-3 px-4 text-slate-700">Tipo</th>
                      <th className="text-left py-3 px-4 text-slate-700">Acción</th>
                      <th className="text-right py-3 px-4 text-slate-700">Cantidad</th>
                      <th className="text-right py-3 px-4 text-slate-700">Precio Compra</th>
                      <th className="text-right py-3 px-4 text-slate-700">Precio Actual</th>
                      <th className="text-right py-3 px-4 text-slate-700">Total</th>
                      <th className="text-right py-3 px-4 text-slate-700">Retorno</th>
                      <th className="text-left py-3 px-4 text-slate-700">Fecha</th>
                      <th className="text-center py-3 px-4 text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.data.map((inv) => {
                      const marketData = pricesQuery.data?.[inv.symbol];
                      const currentPrice = marketData?.price;
                      const purchasePrice = parseFloat(inv.unitPrice.toString());
                      const quantity = parseFloat(inv.quantity.toString());
                      const totalValue = quantity * purchasePrice;
                      
                      let currentTotal = totalValue;
                      let returnVal = 0;
                      let returnPercent = 0;

                      if (currentPrice) {
                        currentTotal = quantity * currentPrice;
                        returnVal = currentTotal - totalValue;
                        returnPercent = (returnVal / totalValue) * 100;
                      }

                      return (
                      <tr key={inv.id} className="border-b border-slate-200 hover:bg-slate-50 border border-slate-200">
                        <td className="py-3 px-4 text-slate-900 font-semibold">{inv.symbol}</td>
                        <td className="py-3 px-4 text-slate-700">{inv.assetType}</td>
                        <td className="py-3 px-4">
                          <span className={inv.action === "buy" ? "text-green-400" : inv.action === "sell" ? "text-red-400" : "text-blue-400"}>
                            {inv.action === "buy" ? "Compra" : inv.action === "sell" ? "Venta" : "Dividendo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">{quantity.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">${purchasePrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          {currentPrice ? `$${currentPrice.toFixed(2)}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900 font-semibold">${totalValue.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          {currentPrice ? (
                            <span className={returnVal >= 0 ? "text-green-400" : "text-red-400"}>
                              {returnVal >= 0 ? "+" : ""}{returnPercent.toFixed(2)}%
                            </span>
                          ) : "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{new Date(inv.transactionDate).toLocaleDateString("es-ES")}</td>
                        <td className="py-3 px-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:bg-slate-600 rounded-full gap-1 px-2"
                            onClick={() => setCommentsDialog({ open: true, investmentId: inv.id, symbol: inv.symbol })}
                          >
                            <MessageSquare className="w-4 h-4 text-primary" />
                            {(inv as any).commentCount > 0 && (
                              <span className="text-xs font-medium text-slate-700">{(inv as any).commentCount}</span>
                            )}
                          </Button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay inversiones</h3>
              <p className="text-slate-500 mb-6">Comienza a registrar tus operaciones de inversión.</p>
              <Button
                onClick={() => setIsAddingInvestment(true)}
                className="bg-primary hover:bg-primary/90"
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
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
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

      <InvestmentCommentsDialog 
        open={commentsDialog.open} 
        onOpenChange={(open) => setCommentsDialog(prev => ({ ...prev, open }))}
        investmentId={commentsDialog.investmentId}
        investmentSymbol={commentsDialog.symbol}
      />
    </DashboardLayout>
  );
}
