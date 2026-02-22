import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, TrendingUp, AlertCircle, FileText, BarChart3, Calendar, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MarketNewsFeed from "@/components/MarketNewsFeed";
import { getMarketNews } from "@/lib/marketNews";
import { BrainCircuit } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const marketNews = useMemo(() => getMarketNews(), []);

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
            <h1 className="text-3xl font-bold text-white">Mis Portafolios</h1>
            <p className="text-slate-400 mt-2">Gestiona y analiza tus portafolios de inversión</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Portafolio
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Crear Nuevo Portafolio</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Crea un nuevo portafolio para comenzar a registrar tus inversiones.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Nombre del Portafolio</Label>
                  <Input
                    placeholder="Mi Portafolio Principal"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Descripción (opcional)</Label>
                  <Textarea
                    placeholder="Describe tu estrategia de inversión..."
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button
                  onClick={handleCreatePortfolio}
                  className="w-full bg-primary hover:bg-primary/90"
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
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Comparar Portafolios
            </Button>
            <Button
              onClick={() => navigate("/analysis")}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Análisis
            </Button>
          </div>
        </div>

        {portfolios.isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Cargando portafolios...</p>
          </div>
        ) : portfolios.data && portfolios.data.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.data.map((portfolio) => (
              <Card
                key={portfolio.id}
                className="bg-slate-800 border-slate-700 cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/portfolio/${portfolio.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{portfolio.name}</span>
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {portfolio.description || "Sin descripción"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">
                      Creado: {new Date(portfolio.createdAt).toLocaleDateString("es-ES")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-600 text-primary hover:bg-slate-700"
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
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay portafolios</h3>
              <p className="text-slate-400 mb-6">Crea tu primer portafolio para comenzar a invertir.</p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Portafolio
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <MarketNewsFeed news={marketNews} limit={5} />
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Próximas Características
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-2">
              <p>✓ Análisis de Monte Carlo</p>
              <p>✓ Recomendaciones personalizadas</p>
              <p>✓ Generación de reportes PDF</p>
              <p>✓ Notificaciones automáticas</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recursos e Integraciones
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Proyectos Organizados:</p>
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-700 text-slate-300" asChild>
                  <a href="/lp/index.html" target="_blank">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Gestión de Activos (LP)
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-700 hover:bg-slate-700 text-slate-300" asChild>
                  <a href="/stock/index.html" target="_blank">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                    MainStock Analytics
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-purple-500/30 hover:bg-purple-500/10 text-purple-400"
                  onClick={() => navigate("/hmm-trading")}
                >
                  <BrainCircuit className="w-4 h-4 mr-2 text-purple-400" />
                  HMM Trading System
                </Button>
              </div>
              <div className="pt-4 space-y-2 border-t border-slate-700">
                <p>📚 Guía de inversión</p>
                <p>📊 Análisis de mercado</p>
                <p>💡 Consejos financieros</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
