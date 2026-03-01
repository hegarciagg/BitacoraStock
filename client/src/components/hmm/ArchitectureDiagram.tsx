import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, GitBranch } from "lucide-react";

const LAYERS = [
  {
    name: "React Dashboard",
    description: "UI interactivo — Señales, Chart, Métricas",
    tech: "React · TypeScript · shadcn/ui",
    color: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/30",
    badge: "bg-cyan-500/15 text-cyan-400",
    dot: "bg-cyan-400",
    emoji: "📊",
  },
  {
    name: "tRPC Layer",
    description: "Type-safe API — Routes con validación Zod",
    tech: "tRPC · Zod · TypeScript",
    color: "from-sky-500/20 to-sky-500/5",
    border: "border-sky-500/30",
    badge: "bg-sky-500/15 text-sky-400",
    dot: "bg-sky-400",
    emoji: "📡",
  },
  {
    name: "Express Backend",
    description: "Orquestador central — Data fetch, Indicadores",
    tech: "Express · Node.js · TypeScript",
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30",
    badge: "bg-blue-500/15 text-blue-400",
    dot: "bg-blue-400",
    emoji: "⚙️",
  },
  {
    name: "Strategy + Risk Engine",
    description: "Sistema de votación 8 consensos · Cooldown 48h",
    tech: "TypeScript · Custom Logic",
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30",
    badge: "bg-purple-500/15 text-purple-400",
    dot: "bg-purple-400",
    emoji: "🗳️",
  },
  {
    name: "Python HMM Microservice",
    description: "GaussianHMM 7 estados · Detect regimes",
    tech: "FastAPI · hmmlearn · numpy · pandas",
    color: "from-green-500/20 to-green-500/5",
    border: "border-green-500/30",
    badge: "bg-green-500/15 text-green-400",
    dot: "bg-green-400",
    emoji: "🐍",
  },
  {
    name: "MySQL Database",
    description: "Persistencia trades · equity_curve",
    tech: "MySQL · Drizzle ORM",
    color: "from-orange-500/20 to-orange-500/5",
    border: "border-orange-500/30",
    badge: "bg-orange-500/15 text-orange-400",
    dot: "bg-orange-400",
    emoji: "🗄️",
  },
];

export default function ArchitectureDiagram() {
  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          Arquitectura del Sistema
        </CardTitle>
        <p className="text-slate-500 text-sm">Flujo de datos desacoplado — microservicios independientes</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-0">
          {LAYERS.map((layer, i) => (
            <div key={layer.name} className="flex flex-col items-center w-full max-w-2xl">
              {/* Layer card */}
              <div
                className={`w-full rounded-xl border ${layer.border} bg-gradient-to-b ${layer.color} p-4 flex items-center gap-4`}
              >
                {/* Dot + Emoji */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${layer.dot} animate-pulse`} />
                  <span className="text-2xl">{layer.emoji}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{layer.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${layer.badge}`}>
                      {layer.tech}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{layer.description}</p>
                </div>
              </div>

              {/* Arrow between layers */}
              {i < LAYERS.length - 1 && (
                <div className="flex flex-col items-center my-1 opacity-50">
                  <div className="w-px h-2 bg-slate-600" />
                  <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                  <div className="w-px h-2 bg-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Port info */}
        <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 border border-slate-300">
          <p className="text-xs text-slate-500 font-mono text-center">
            <span className="text-cyan-400">React :3000</span>
            {" "}→{" "}
            <span className="text-blue-400">Express :4000</span>
            {" "}→{" "}
            <span className="text-green-400">Python FastAPI :8000</span>
            {" "}→{" "}
            <span className="text-orange-400">MySQL :3306</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
