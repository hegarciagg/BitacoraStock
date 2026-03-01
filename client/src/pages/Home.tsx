import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, BarChart3, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-200 bg-slate-50/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-slate-900">Web Financiera</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Iniciar Sesión</a>
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">Optimiza tu Portafolio de Inversión</h2>
          <p className="text-xl text-slate-700 mb-8">
            Análisis avanzado de portafolios con simulación de Monte Carlo, recomendaciones personalizadas y reportes detallados.
          </p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
            <a href={getLoginUrl()}>Comenzar Ahora <ArrowRight className="ml-2 w-4 h-4" /></a>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-slate-900">Análisis de Portafolio</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-700">
                Visualiza tu portafolio actual con métricas clave, composición de activos y análisis de diversificación.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
              <Zap className="w-8 h-8 text-yellow-500 mb-2" />
              <CardTitle className="text-slate-900">Simulación Monte Carlo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-700">
                Proyecciones precisas de rendimiento futuro con análisis de riesgo y Value at Risk (VaR).
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle className="text-slate-900">Recomendaciones IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-700">
                Recomendaciones personalizadas basadas en tu perfil de riesgo y análisis avanzado.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
