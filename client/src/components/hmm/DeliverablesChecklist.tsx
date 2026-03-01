import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Square, ClipboardList } from "lucide-react";

type ItemStatus = "pending" | "in-progress" | "done";

interface DeliverableItem {
  id: string;
  emoji: string;
  label: string;
  description: string;
  status: ItemStatus;
}

const INITIAL_ITEMS: DeliverableItem[] = [
  {
    id: "python-svc",
    emoji: "🐍",
    label: "Python Microservice",
    description: "FastAPI + hmmlearn + /detect-regimes endpoint + Dockerfile",
    status: "pending",
  },
  {
    id: "strategy-engine",
    emoji: "⚡",
    label: "Strategy Engine",
    description: "Voting logic + cooldown + entry/exit rules en TypeScript",
    status: "pending",
  },
  {
    id: "backend-api",
    emoji: "⚙️",
    label: "Backend TypeScript API",
    description: "Express + tRPC + Feature Engineering + Python client",
    status: "pending",
  },
  {
    id: "mysql-schema",
    emoji: "🗄️",
    label: "MySQL Schema",
    description: "Tablas trades + equity_curve + migrations",
    status: "pending",
  },
  {
    id: "react-dashboard",
    emoji: "📊",
    label: "React Dashboard UI",
    description: "Señales, chart BTC con regímenes, metrics panel",
    status: "pending",
  },
  {
    id: "backtesting",
    emoji: "📈",
    label: "Backtesting Engine",
    description: "Simulación histórica BTC 730 días con leverage",
    status: "pending",
  },
  {
    id: "documentation",
    emoji: "📚",
    label: "Documentación Técnica",
    description: "README técnico completo + guía de setup + Dockerfiles",
    status: "pending",
  },
];

const STATUS_CYCLE: Record<ItemStatus, ItemStatus> = {
  pending: "in-progress",
  "in-progress": "done",
  done: "pending",
};

const STATUS_STYLES: Record<ItemStatus, { badge: string; labelColor: string }> = {
  pending: { badge: "bg-slate-600/50 text-slate-500 border-slate-500/30", labelColor: "text-slate-700" },
  "in-progress": { badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", labelColor: "text-slate-900" },
  done: { badge: "bg-green-500/15 text-green-400 border-green-500/30", labelColor: "text-slate-900" },
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  pending: "Pendiente",
  "in-progress": "En desarrollo",
  done: "✓ Completo",
};

export default function DeliverablesChecklist() {
  const [items, setItems] = useState<DeliverableItem[]>(INITIAL_ITEMS);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: STATUS_CYCLE[item.status] }
          : item
      )
    );
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const progressPct = Math.round((doneCount / items.length) * 100);

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-green-400" />
            Checklist de Entregables
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{doneCount}/{items.length}</span>
            <span className={`text-sm font-bold ${progressPct === 100 ? "text-green-400" : progressPct > 0 ? "text-yellow-400" : "text-slate-500"}`}>
              {progressPct}%
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Haz click en cualquier ítem para rotar su estado: Pendiente → En desarrollo → Completo
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const styles = STATUS_STYLES[item.status];
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-100/20 hover:bg-slate-100/40 transition-all flex items-center gap-4 group"
              >
                {/* Checkbox icon */}
                <div className="flex-shrink-0 text-slate-500 group-hover:text-slate-700 transition-colors">
                  {item.status === "done" ? (
                    <CheckSquare className="w-5 h-5 text-green-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>

                {/* Emoji */}
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${styles.labelColor} ${item.status === "done" ? "line-through opacity-70" : ""}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>

                {/* Status badge */}
                <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-semibold ${styles.badge}`}>
                  {STATUS_LABELS[item.status]}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
