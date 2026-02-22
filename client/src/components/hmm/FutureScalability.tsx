import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket } from "lucide-react";

const FUTURE_ITEMS = [
  {
    emoji: "📈",
    title: "Walk-Forward Validation",
    description: "Validación temporal cruzada para evitar overfitting. Entrenamiento en ventanas deslizantes.",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-400",
  },
  {
    emoji: "🌐",
    title: "Multi-Asset Support",
    description: "Extensión a ETH, índices y commodities. Detección de regímenes por activo individualizado.",
    color: "border-purple-500/30 bg-purple-500/5",
    badge: "bg-purple-500/15 text-purple-400",
  },
  {
    emoji: "🎯",
    title: "Regime Probability Weighting",
    description: "Usar model.predict_proba() para ponderar señales por confianza del régimen.",
    color: "border-cyan-500/30 bg-cyan-500/5",
    badge: "bg-cyan-500/15 text-cyan-400",
  },
  {
    emoji: "⚡",
    title: "Live Trading Integration",
    description: "Adaptador Binance WebSocket para señales en tiempo real con ejecución automática.",
    color: "border-yellow-500/30 bg-yellow-500/5",
    badge: "bg-yellow-500/15 text-yellow-400",
  },
  {
    emoji: "📊",
    title: "Performance Attribution",
    description: "Módulo para atribuir PnL por régimen, indicador y período. Análisis granular de estrategia.",
    color: "border-green-500/30 bg-green-500/5",
    badge: "bg-green-500/15 text-green-400",
  },
  {
    emoji: "🔄",
    title: "Regime Transition Analytics",
    description: "Análisis de probabilidades de transición entre regímenes. Matriz de Markov visualizada.",
    color: "border-orange-500/30 bg-orange-500/5",
    badge: "bg-orange-500/15 text-orange-400",
  },
];

export default function FutureScalability() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Rocket className="w-5 h-5 text-yellow-400" />
          Escalabilidad Futura
        </CardTitle>
        <p className="text-slate-400 text-sm">Arquitectura diseñada para evolucionar — roadmap de features avanzados</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FUTURE_ITEMS.map((item) => (
            <div
              key={item.title}
              className={`p-4 rounded-xl border ${item.color} flex flex-col gap-3 hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-bold text-white">{item.title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              <div className={`text-xs px-2 py-0.5 rounded-full border w-fit font-semibold ${item.badge}`}>
                Roadmap
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
