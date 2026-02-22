import { BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const TECH_BADGES = [
  { label: "Python 3.11", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  { label: "FastAPI", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { label: "hmmlearn", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { label: "TypeScript", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { label: "Express", color: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  { label: "tRPC", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  { label: "React", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { label: "MySQL", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { label: "GaussianHMM", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
];

export default function HeroSection() {
  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      {/* Gradient accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500" />
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <BrainCircuit className="w-8 h-8 text-purple-400" />
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
                Project Hub · BitacoraStock
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Regime-Based{" "}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Trading System
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Sistema de trading profesional basado en detección de regímenes de mercado mediante{" "}
              <span className="text-white font-semibold">Hidden Markov Models</span>{" "}
              con estrategia institucional de votación de 8 confirmaciones.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            <div className="p-3 rounded-xl bg-slate-700/50 border border-slate-600">
              <p className="text-2xl font-bold text-white">7</p>
              <p className="text-xs text-slate-400">Estados HMM</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-700/50 border border-slate-600">
              <p className="text-2xl font-bold text-white">8</p>
              <p className="text-xs text-slate-400">Confirmaciones</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-700/50 border border-slate-600">
              <p className="text-2xl font-bold text-white">1.3x</p>
              <p className="text-xs text-slate-400">Leverage</p>
            </div>
          </div>

          {/* Tech Badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {TECH_BADGES.map((badge) => (
              <span
                key={badge.label}
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${badge.color}`}
              >
                {badge.label}
              </span>
            ))}
          </div>

          {/* Warning notice */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/8 border border-yellow-500/20 text-sm text-yellow-400 max-w-lg">
            <span>⚠️</span>
            <span>
              Esta página es un <strong>blueprint técnico</strong> — documentación y fuente de verdad para desarrollo con Antigravity. No implementa el sistema HMM directamente.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
