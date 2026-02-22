import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode2, ChevronDown, ChevronUp } from "lucide-react";

interface AccordionItemProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
}

function AccordionItem({ title, badge, children }: AccordionItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white text-sm">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/50 bg-slate-700/20">
          {children}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 p-4 rounded-lg bg-slate-900/70 border border-slate-700 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
      {children}
    </pre>
  );
}

function TableSpec({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="border-b border-slate-700">
            {headers.map((h) => (
              <th key={h} className="py-2 px-3 text-slate-400 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-3 text-slate-300 font-mono">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const VOTING_RULES = [
  { n: "1", rule: "RSI < 90", desc: "No sobrecomprado extremo" },
  { n: "2", rule: "Momentum > 1%", desc: "Impulso positivo" },
  { n: "3", rule: "Volatility < 6%", desc: "Volatilidad controlada" },
  { n: "4", rule: "Volume > SMA20", desc: "Volumen confirma movimiento" },
  { n: "5", rule: "ADX > 25", desc: "Tendencia fuerte definida" },
  { n: "6", rule: "Price > EMA50", desc: "Precio sobre media corta" },
  { n: "7", rule: "Price > EMA200", desc: "Tendencia de largo plazo alcista" },
  { n: "8", rule: "MACD > Signal", desc: "Cruce MACD bullish" },
];

export default function TechnicalSpecs() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-cyan-400" />
          Especificaciones Técnicas
        </CardTitle>
        <p className="text-slate-400 text-sm">Expandir cada sección para ver los detalles de implementación</p>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* A. HMM Config */}
        <AccordionItem title="A. Configuración HMM" badge="GaussianHMM">
          <CodeBlock>
{`GaussianHMM(
    n_components     = 7,          # 7 estados ocultos
    covariance_type  = "full",     # Matriz de covarianza completa
    n_iter           = 1000,       # Iteraciones máximas EM
    random_state     = 42          # Reproducibilidad
)

# Features de entrada
X = [Returns, Range, VolVolatility]   # shape: (n_samples, 3)

# Detección
model.fit(X)
states = model.predict(X)

# Identificación de regímenes
mean_return_per_state = groupby(states).mean(returns)
bullState = argmax(mean_return_per_state)
bearState = argmin(mean_return_per_state)

# Endpoint: POST /detect-regimes
# Output: { states: int[], bullState: int, bearState: int }`}
          </CodeBlock>
        </AccordionItem>

        {/* B. Voting Rules */}
        <AccordionItem title="B. Sistema de Votación Institucional" badge="8 Confirmaciones">
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-3">
              Entrada LONG solo si: <span className="text-white font-mono">state == bullState AND votingScore ≥ 7 AND now &gt; cooldownUntil</span>
            </p>
            <TableSpec
              headers={["#", "Condición", "Descripción"]}
              rows={VOTING_RULES.map((r) => [r.n, r.rule, r.desc])}
            />
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">
                <strong>Exit rule:</strong> Salir inmediatamente si <code className="font-mono">state == bearState</code>.<br />
                <strong>Cooldown:</strong> <code className="font-mono">cooldownUntil = now + 48h</code> — no reentrada durante cooldown.
              </p>
            </div>
          </div>
        </AccordionItem>

        {/* C. Risk Formula */}
        <AccordionItem title="C. Fórmula de Riesgo y PnL" badge="Leverage 1.3x">
          <CodeBlock>
{`// Capital inicial
initialCapital = $10,000

// Leverage
leverage = 1.3

// Cálculo de PnL por trade
PnL = ((exitPrice - entryPrice) / entryPrice) × capital × leverage

// Capital dinámico
capital(t+1) = capital(t) + PnL(t)

// Ejemplo:
// entry = 40,000 | exit = 42,000 | capital = 10,000
// PnL = ((42000 - 40000) / 40000) × 10000 × 2.5
// PnL = 0.05 × 10000 × 2.5 = $1,250`}
          </CodeBlock>
        </AccordionItem>

        {/* D. Database Schema */}
        <AccordionItem title="D. Esquema de Base de Datos" badge="MySQL">
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">Tabla: <code className="text-orange-400">trades</code></p>
              <TableSpec
                headers={["Campo", "Tipo", "Descripción"]}
                rows={[
                  ["id", "INT AUTO_INCREMENT", "PK"],
                  ["entry_price", "DECIMAL(18,8)", "Precio de entrada"],
                  ["exit_price", "DECIMAL(18,8)", "Precio de salida"],
                  ["pnl", "DECIMAL(18,4)", "Ganancia/Pérdida neta"],
                  ["leverage", "DECIMAL(4,2)", "Apalancamiento usado"],
                  ["entry_time", "DATETIME", "Timestamp entrada"],
                  ["exit_time", "DATETIME", "Timestamp salida"],
                  ["regime", "TINYINT", "Estado HMM al entrar"],
                  ["confirmations", "TINYINT", "Votos institucionales"],
                ]}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">Tabla: <code className="text-orange-400">equity_curve</code></p>
              <TableSpec
                headers={["Campo", "Tipo", "Descripción"]}
                rows={[
                  ["id", "INT AUTO_INCREMENT", "PK"],
                  ["timestamp", "DATETIME", "Momento del registro"],
                  ["equity", "DECIMAL(18,4)", "Capital acumulado"],
                ]}
              />
            </div>
          </div>
        </AccordionItem>

        {/* E. Metrics */}
        <AccordionItem title="E. Métricas de Rendimiento" badge="5 KPIs">
          <CodeBlock>
{`// Total Return
totalReturn = (finalEquity - initialCapital) / initialCapital × 100

// Buy & Hold Return (BTC)
bhReturn = (btcPriceEnd - btcPriceStart) / btcPriceStart × 100

// Alpha
alpha = totalReturn - bhReturn

// Win Rate
winRate = tradesWon / totalTrades × 100

// Max Drawdown
rollingMax   = cumulative_max(equity_curve)
drawdown     = (equity_curve - rollingMax) / rollingMax
maxDrawdown  = min(drawdown) × 100`}
          </CodeBlock>
        </AccordionItem>

        {/* F. tRPC Endpoints */}
        <AccordionItem title="F. tRPC Endpoints" badge="4 Routes">
          <CodeBlock>
{`// Router: hmmRouter

getCurrentSignal()
  // → { signal: "LONG" | "CASH", regime: number,
  //     bullState: number, bearState: number,
  //     votingScore: number, cooldownUntil: Date | null }

getPerformanceMetrics()
  // → { totalReturn: number, bhReturn: number, alpha: number,
  //     winRate: number, maxDrawdown: number, totalTrades: number }

getEquityCurve()
  // → Array<{ timestamp: Date, equity: number }>

getTrades()
  // → Array<{ id, entryPrice, exitPrice, pnl, regime,
  //            confirmations, entryTime, exitTime }>`}
          </CodeBlock>
        </AccordionItem>

        {/* G. HMM Features */}
        <AccordionItem title="G. Feature Engineering" badge="3 HMM + 8 Técnicos">
          <CodeBlock>
{`// ── HMM Features ────────────────────────────────────
Returns       = (close[t] - close[t-1]) / close[t-1]
Range         = (high[t] - low[t]) / close[t]
VolVolatility = (volume[t] - volume[t-1]) / volume[t-1]

// ── Indicadores Técnicos ─────────────────────────────
RSI(14)           // Relative Strength Index 14 períodos
Momentum(12)      // (close[t] / close[t-12] - 1) × 100
Volatility        // rolling std 24 períodos
ADX               // Average Directional Index
EMA_50            // Exponential Moving Average 50
EMA_200           // Exponential Moving Average 200
MACD              // EMA12 - EMA26
Signal            // EMA9 del MACD
Volume_SMA20      // Simple Moving Average volumen 20`}
          </CodeBlock>
        </AccordionItem>

      </CardContent>
    </Card>
  );
}
