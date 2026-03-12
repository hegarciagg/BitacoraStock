import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, TrendingUp, AlertCircle, FileText, BarChart3, Calendar, Zap, BrainCircuit, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MarketNewsFeed from "@/components/MarketNewsFeed";
import { getMarketNews } from "@/lib/marketNews";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const newsQuery = useQuery({
    queryKey: ['market-news'],
    queryFn: getMarketNews,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });

  const portfolios = trpc.portfolio.list.useQuery();
  const createPortfolio = trpc.portfolio.create.useMutation({
    onSuccess: () => {
      portfolios.refetch();
      setNewPortfolioName("");
      setNewPortfolioDesc("");
      setIsCreating(false);
    },
  });

  const handleCreatePortfolio = async () => {
    if (newPortfolioName.trim()) {
      await createPortfolio.mutateAsync({
        name: newPortfolioName,
        description: newPortfolioDesc || undefined,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mis Portafolios</h1>
            <p className="text-slate-500 mt-2">Gestiona y analiza tus portafolios de inversión</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Portafolio
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Crear Nuevo Portafolio</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Crea un nuevo portafolio para comenzar a registrar tus inversiones.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-700">Nombre del Portafolio</Label>
                  <Input
                    placeholder="Mi Portafolio Principal"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-700">Descripción (opcional)</Label>
                  <Textarea
                    placeholder="Describe tu estrategia de inversión..."
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900"
                  />
                </div>
                <Button
                  onClick={handleCreatePortfolio}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                  disabled={!newPortfolioName.trim() || createPortfolio.isPending}
                >
                  {createPortfolio.isPending ? "Creando..." : "Crear Portafolio"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
            <Button
              onClick={() => navigate("/compare")}
              variant="outline"
              className="border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/10"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Comparar Portafolios
            </Button>
            <Button
              onClick={() => navigate("/analysis")}
              variant="outline"
              className="border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/10"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Análisis
            </Button>
          </div>
        </div>

        {portfolios.isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Cargando portafolios...</p>
          </div>
        ) : portfolios.data && portfolios.data.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.data.map((portfolio) => (
              <Card
                key={portfolio.id}
                className="bg-white border-slate-200 shadow-sm cursor-pointer hover:border-[#3b82f6] transition-colors"
                onClick={() => navigate(`/portfolio/${portfolio.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center justify-between">
                    <span>{portfolio.name}</span>
                    <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    {portfolio.description || "Sin descripción"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">
                      Creado: {new Date(portfolio.createdAt).toLocaleDateString("es-ES")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-200 text-[#3b82f6] hover:bg-slate-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/portfolio/${portfolio.id}`);
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay portafolios</h3>
              <p className="text-slate-500 mb-6">Crea tu primer portafolio para comenzar a invertir.</p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Portafolio
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <MarketNewsFeed 
            news={newsQuery.data} 
            isLoading={newsQuery.isLoading} 
            isRefetching={newsQuery.isRefetching}
            onRefresh={() => newsQuery.refetch()}
            limit={5} 
          />
          
          <div className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Próximas Características
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 space-y-2">
                <p>✓ Análisis de Monte Carlo</p>
                <p>✓ Recomendaciones personalizadas</p>
                <p>✓ Generación de reportes PDF</p>
                <p>✓ Notificaciones automáticas</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#3b82f6]" />
                  Recursos e Integraciones
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 mb-2">Proyectos Organizados:</p>
                  <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50 text-slate-700" asChild>
                    <a href="/lp/index.html" target="_blank">
                      <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                      Gestión de Activos (LP)
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50 text-slate-700" asChild>
                    <a href="/stock/index.html" target="_blank">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      MainStock Analytics
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-purple-200 hover:bg-purple-50 text-purple-700"
                    onClick={() => navigate("/hmm-trading")}
                  >
                    <BrainCircuit className="w-4 h-4 mr-2 text-purple-600" />
                    HMM Trading System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
