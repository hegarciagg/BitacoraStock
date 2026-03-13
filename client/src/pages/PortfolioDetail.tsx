import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, ArrowLeft, TrendingUp, AlertCircle, BarChart3, TrendingUp as TrendingUpIcon, Clock, Zap } from "lucide-react";
import { useState, useMemo } from "react";
import { PortfolioHistoryTimeline } from "@/components/PortfolioHistoryTimeline";
import { EvolutionChart } from "@/components/EvolutionChart";
import { ExportHistoryButtons } from "@/components/ExportHistoryButtons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InvestmentCommentsDialog } from "@/components/InvestmentCommentsDialog";
import { MessageSquare, MoreHorizontal, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; investmentId: number | null }>({
    open: false,
    investmentId: null,
  });

  const [editDialog, setEditDialog] = useState<{ open: boolean; investmentId: number | null; formData: typeof formData }>({
    open: false,
    investmentId: null,
    formData: {
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
    }
  });

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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

  const updateInvestment = trpc.investment.update.useMutation({
    onSuccess: () => {
      investments.refetch();
      setEditDialog({ ...editDialog, open: false, investmentId: null });
    },
  });

  const deleteInvestment = trpc.investment.delete.useMutation({
    onSuccess: () => {
      investments.refetch();
      setDeleteDialog({ open: false, investmentId: null });
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

  const handleUpdateInvestment = async () => {
    if (!editDialog.investmentId) return;
    const totalValue = (parseFloat(editDialog.formData.quantity) * parseFloat(editDialog.formData.unitPrice)).toString();
    await updateInvestment.mutateAsync({
      portfolioId: portfolioId_num,
      investmentId: editDialog.investmentId,
      symbol: editDialog.formData.symbol,
      assetName: editDialog.formData.assetName,
      assetType: editDialog.formData.assetType as any,
      quantity: editDialog.formData.quantity,
      unitPrice: editDialog.formData.unitPrice,
      totalValue,
      commission: editDialog.formData.commission || "0",
      transactionDate: new Date(editDialog.formData.transactionDate),
      comments: editDialog.formData.comments || undefined,
      purchaseReason: editDialog.formData.purchaseReason || undefined,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.investmentId) return;
    await deleteInvestment.mutateAsync({
      investmentId: deleteDialog.investmentId,
      portfolioId: portfolioId_num,
    });
  };

  const assetTypeLabels: Record<string, string> = {
    stock: "Acción",
    etf: "ETF",
    bond: "Bono",
    crypto: "Criptomoneda",
    commodity: "Materias Primas",
    fund: "Fondo",
    other: "Otro",
  };

  const assetTypeSummary = useMemo(() => {
    if (!investments.data) return { summary: [], portfolioTotals: { totalPurchase: 0, totalCurrent: 0 } };
    
    const summaryMap = new Map<string, { totalPurchase: number; totalCurrent: number }>();
    
    investments.data.forEach((inv) => {
      const marketData = pricesQuery.data?.[inv.symbol] || pricesQuery.data?.[inv.symbol.toUpperCase()];
      const currentPrice = marketData?.price;
      const purchasePrice = parseFloat(inv.unitPrice.toString());
      const quantity = parseFloat(inv.quantity.toString());
      const purchaseValue = quantity * purchasePrice;
      
      const currentValue = currentPrice ? quantity * currentPrice : purchaseValue;
      
      const current = summaryMap.get(inv.assetType) || { totalPurchase: 0, totalCurrent: 0 };
      summaryMap.set(inv.assetType, {
        totalPurchase: current.totalPurchase + purchaseValue,
        totalCurrent: current.totalCurrent + currentValue,
      });
    });
    
    const portfolioTotals = Array.from(summaryMap.values()).reduce((acc, curr) => ({
      totalPurchase: acc.totalPurchase + curr.totalPurchase,
      totalCurrent: acc.totalCurrent + curr.totalCurrent,
    }), { totalPurchase: 0, totalCurrent: 0 });

    const summary = Array.from(summaryMap.entries()).map(([type, totals]) => ({
      type,
      label: assetTypeLabels[type] || type,
      ...totals
    }));

    return {
      summary,
      portfolioTotals
    };
  }, [investments.data, pricesQuery.data]);

  const sortedInvestments = useMemo(() => {
    if (!investments.data) return [];
    const items = [...investments.data];
    if (sortConfig !== null) {
      items.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Traducir tipos de activo para ordenar por etiqueta visible si el usuario ordena por tipo
        if (sortConfig.key === 'assetType') {
          aValue = assetTypeLabels[a.assetType] || a.assetType;
          bValue = assetTypeLabels[b.assetType] || b.assetType;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [investments.data, sortConfig, assetTypeLabels]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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
                      <SelectItem value="commodity">Materias Primas</SelectItem>
                      <SelectItem value="fund">Fondo</SelectItem>
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
          <>
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
                        <th className="text-left py-3 px-4 text-slate-700 cursor-pointer hover:text-primary transition-colors group" onClick={() => requestSort('symbol')}>
                          <div className="flex items-center gap-1">
                            Símbolo
                            {sortConfig?.key === 'symbol' ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 text-slate-700 cursor-pointer hover:text-primary transition-colors group" onClick={() => requestSort('assetType')}>
                          <div className="flex items-center gap-1">
                            Tipo
                            {sortConfig?.key === 'assetType' ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 text-slate-700 cursor-pointer hover:text-primary transition-colors group" onClick={() => requestSort('action')}>
                          <div className="flex items-center gap-1">
                            Acción
                            {sortConfig?.key === 'action' ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 text-slate-700 cursor-pointer hover:text-primary transition-colors group" onClick={() => requestSort('quantity')}>
                          <div className="flex items-center justify-end gap-1">
                            Cantidad
                            {sortConfig?.key === 'quantity' ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 text-slate-700 cursor-pointer hover:text-primary transition-colors group" onClick={() => requestSort('unitPrice')}>
                          <div className="flex items-center justify-end gap-1">
                            Precio Compra
                            {sortConfig?.key === 'unitPrice' ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 text-slate-700">Precio Actual</th>
                        <th className="text-right py-3 px-4 text-slate-700 cursor-pointer hover:text-primary transition-colors group" onClick={() => requestSort('totalValue')}>
                          <div className="flex items-center justify-end gap-1">
                            Total
                            {sortConfig?.key === 'totalValue' ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 text-slate-700">Retorno</th>
                        <th className="text-left py-3 px-4 text-slate-700 cursor-pointer hover:text-primary transition-colors group" onClick={() => requestSort('transactionDate')}>
                          <div className="flex items-center gap-1">
                            Fecha
                            {sortConfig?.key === 'transactionDate' ? (
                              sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="text-center py-3 px-4 text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedInvestments.map((inv: any) => {
                        const marketData = pricesQuery.data?.[inv.symbol] || pricesQuery.data?.[inv.symbol.toUpperCase()];
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
                          <td className="py-3 px-4 text-slate-700">{assetTypeLabels[inv.assetType] || inv.assetType}</td>
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
                          <td className="py-3 px-4 text-right text-slate-900 font-semibold">${currentTotal.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            {currentPrice ? (
                              <span className={returnVal >= 0 ? "text-green-400" : "text-red-400"}>
                                {returnVal >= 0 ? "+" : ""}{returnPercent.toFixed(2)}%
                              </span>
                            ) : "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{new Date(inv.transactionDate).toLocaleDateString("es-ES")}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center items-center gap-1">
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
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-600 rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-slate-700" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditDialog({
                                      open: true,
                                      investmentId: inv.id,
                                      formData: {
                                        symbol: inv.symbol,
                                        assetName: inv.assetName,
                                        assetType: inv.assetType as any,
                                        action: inv.action as any,
                                        quantity: inv.quantity.toString(),
                                        unitPrice: inv.unitPrice.toString(),
                                        commission: inv.commission?.toString() || "0",
                                        transactionDate: new Date(inv.transactionDate).toISOString().split("T")[0],
                                        comments: inv.comments || "",
                                        purchaseReason: inv.purchaseReason || "",
                                      }
                                    });
                                  }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-500 hover:text-red-500 hover:bg-red-50 focus:text-red-500 focus:bg-red-50" onClick={() => setDeleteDialog({ open: true, investmentId: inv.id })}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Resumen por tipo de activo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
              {/* Card Total Portafolio */}
              <Card className="bg-primary/5 shadow-sm border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        Total Portafolio
                      </span>
                      <BarChart3 className="w-3 h-3 text-primary/40" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      ${assetTypeSummary.portfolioTotals.totalCurrent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-primary/10">
                      <span className="text-[10px] text-slate-500">
                        Inversión: ${assetTypeSummary.portfolioTotals.totalPurchase.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {Math.abs(assetTypeSummary.portfolioTotals.totalCurrent - assetTypeSummary.portfolioTotals.totalPurchase) > 0.01 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${assetTypeSummary.portfolioTotals.totalCurrent >= assetTypeSummary.portfolioTotals.totalPurchase ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {assetTypeSummary.portfolioTotals.totalCurrent >= assetTypeSummary.portfolioTotals.totalPurchase ? '+' : ''}
                          {((assetTypeSummary.portfolioTotals.totalCurrent - assetTypeSummary.portfolioTotals.totalPurchase) / assetTypeSummary.portfolioTotals.totalPurchase * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {assetTypeSummary.summary.map((item) => (
                <Card key={item.type} className="bg-white shadow-sm border-slate-200 hover:border-primary/20 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.label}
                        </span>
                        <TrendingUp className="w-3 h-3 text-slate-300" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        ${item.totalCurrent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                        <span className="text-[10px] text-slate-500">
                          Coste: ${item.totalPurchase.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {Math.abs(item.totalCurrent - item.totalPurchase) > 0.01 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.totalCurrent >= item.totalPurchase ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {item.totalCurrent >= item.totalPurchase ? '↑' : '↓'}
                            {Math.abs((item.totalCurrent - item.totalPurchase) / item.totalPurchase * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
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

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta inversión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Cuidado, esto alterará los saldos y métricas históricas de tu portafolio permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInvestment.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
              disabled={deleteInvestment.isPending}
            >
              {deleteInvestment.isPending ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-white shadow-sm border-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Inversión</DialogTitle>
            <DialogDescription className="text-slate-500">
              Modifica los detalles de la operación de inversión.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-900">Símbolo</Label>
              <Input
                placeholder="AAPL"
                value={editDialog.formData.symbol}
                onChange={(e) => setEditDialog(p => ({ ...p, formData: { ...p.formData, symbol: e.target.value } }))}
                className="bg-slate-100 border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <Label className="text-slate-900">Tipo de Activo</Label>
              <Select 
                value={editDialog.formData.assetType} 
                onValueChange={(value: any) => setEditDialog(p => ({ ...p, formData: { ...p.formData, assetType: value } }))}
              >
                <SelectTrigger className="bg-slate-100 border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-100 border-slate-300">
                  <SelectItem value="stock">Acción</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="bond">Bono</SelectItem>
                  <SelectItem value="crypto">Criptomoneda</SelectItem>
                  <SelectItem value="commodity">Materias Primas</SelectItem>
                  <SelectItem value="fund">Fondo</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-900">Cantidad</Label>
              <Input
                type="number"
                placeholder="10"
                value={editDialog.formData.quantity}
                onChange={(e) => setEditDialog(p => ({ ...p, formData: { ...p.formData, quantity: e.target.value } }))}
                className="bg-slate-100 border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <Label className="text-slate-900">Precio Unitario</Label>
              <Input
                type="number"
                placeholder="150.50"
                value={editDialog.formData.unitPrice}
                onChange={(e) => setEditDialog(p => ({ ...p, formData: { ...p.formData, unitPrice: e.target.value } }))}
                className="bg-slate-100 border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <Label className="text-slate-900">Comisión</Label>
              <Input
                type="number"
                placeholder="0"
                value={editDialog.formData.commission}
                onChange={(e) => setEditDialog(p => ({ ...p, formData: { ...p.formData, commission: e.target.value } }))}
                className="bg-slate-100 border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <Label className="text-slate-900">Fecha de Transacción</Label>
              <Input
                type="date"
                value={editDialog.formData.transactionDate}
                onChange={(e) => setEditDialog(p => ({ ...p, formData: { ...p.formData, transactionDate: e.target.value } }))}
                className="bg-slate-100 border-slate-300 text-slate-900"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-900">Comentarios (opcional)</Label>
              <Textarea
                placeholder="Notas sobre esta inversión..."
                value={editDialog.formData.comments}
                onChange={(e) => setEditDialog(p => ({ ...p, formData: { ...p.formData, comments: e.target.value } }))}
                className="bg-slate-100 border-slate-300 text-slate-900"
              />
            </div>
          </div>
          <Button
            onClick={handleUpdateInvestment}
            className="w-full bg-primary hover:bg-primary/90 mt-4"
            disabled={!editDialog.formData.symbol || !editDialog.formData.quantity || !editDialog.formData.unitPrice || updateInvestment.isPending}
          >
            {updateInvestment.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
