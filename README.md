<div align="center">

# 📊 BitacoraStock

**Plataforma profesional de análisis e inversión — Portfolio Management · Monte Carlo · HMM Trading System**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://www.python.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)](https://www.mysql.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## ✨ Características Principales

| Módulo | Descripción |
|--------|-------------|
| 📂 **Gestión de Portafolio** | CRUD completo de portafolios e inversiones con historial de cambios |
| 🎲 **Monte Carlo** | Simulación avanzada (500 k iteraciones), VaR, Sharpe Ratio y PDF personalizable |
| 🔮 **Análisis de Sentimiento** | Integración NewsAPI + LLM para análisis NLP con caché inteligente |
| 📉 **Backtesting Histórico** | Pruebas de estrategias sobre eventos reales (2008, COVID, etc.) |
| 🧠 **HMM Trading System** | Régimen de mercado con Hidden Markov Models + estrategia institucional |
| 📊 **Optimizador LP** | Concentrated Liquidity y Efficient Frontier para DeFi |
| 📈 **Análisis de Escenarios** | Impacto de crisis, inflación y recesión sobre el portafolio |
| 🔔 **Notificaciones** | Sistema de alertas toast en tiempo real |
| 🧮 **QuantEngine** | Optimizador de portafolio con Markowitz, CAPM y beta |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   React 18 + Vite                    │
│      (Dashboard · Portfolio · HMM · LP · Stock)      │
└──────────────────────┬──────────────────────────────┘
                       │ tRPC (type-safe API)
┌──────────────────────▼──────────────────────────────┐
│              Express.js + TypeScript                 │
│   routers.ts · services/ · db.ts (Drizzle ORM)      │
└───────────┬────────────────────────┬────────────────┘
            │ MySQL 8.0              │ HTTP
┌───────────▼────────┐   ┌──────────▼────────────────┐
│   BitacoraStock DB  │   │  Python HMM Microservice  │
│  (Drizzle schema)  │   │  FastAPI + GaussianHMM     │
└────────────────────┘   └───────────────────────────┘
```

### Stack tecnológico

| Capa | Tecnologías |
|------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, shadcn/ui, Recharts, tRPC client |
| **Backend** | Node.js 20, TypeScript, Express, tRPC, Drizzle ORM |
| **Base de datos** | MySQL 8.0 |
| **HMM Service** | Python 3.11, FastAPI, hmmlearn (GaussianHMM), scikit-learn |
| **Auth** | OAuth 2.0 (Google), sesiones en cookie |
| **Infra** | Docker Compose |

---

## 📁 Estructura del Proyecto

```
BitacoraStock/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   └── hmm/           # HMM Trading System UI
│   │   │       ├── AssetSelector.tsx
│   │   │       ├── LiveDashboard.tsx
│   │   │       ├── SignalPanel.tsx
│   │   │       ├── MetricsPanel.tsx
│   │   │       ├── RegimeChart.tsx
│   │   │       └── TradesTable.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── HMMTradingSystem.tsx
│   │   │   ├── SimulationAnalysis.tsx
│   │   │   ├── SentimentAnalysisPage.tsx
│   │   │   ├── Backtesting.tsx
│   │   │   └── ScenarioAnalysis.tsx
│   │   └── lib/trpc.ts
│   └── public/
│       ├── lp/                # Concentrated Liquidity calculator
│       └── stock/             # Markowitz portfolio optimizer
├── server/
│   ├── _core/                 # Express setup, tRPC, auth, OAuth
│   ├── services/
│   │   ├── hmmFeatureService.ts    # BTC data + technical indicators
│   │   ├── hmmStrategyService.ts   # 8-confirmation voting engine
│   │   ├── hmmRiskService.ts       # Backtest engine (2.5x leverage)
│   │   ├── hmmPersistenceService.ts
│   │   ├── monteCarloService.ts
│   │   ├── sentimentAnalysisService.ts
│   │   └── backtestingService.ts
│   ├── routers.ts             # Main tRPC router
│   ├── routers.hmm.ts         # HMM procedures
│   └── db.ts                  # All database queries
├── hmm-service/               # Python HMM Microservice
│   ├── main.py                # FastAPI + GaussianHMM(7 states)
│   ├── requirements.txt
│   └── Dockerfile
├── drizzle/
│   └── schema.ts              # Database schema (15 tables)
├── docker-compose.yml
└── README_HMM.md              # HMM setup guide detallado
```

---

## 🧠 HMM Trading System

El módulo más avanzado — detecta regímenes de mercado (Bull/Bear/Neutral) mediante Hidden Markov Models y genera señales de trading usando una estrategia institucional de 8 confirmaciones.

### Flujo del Pipeline

```
Yahoo Finance (730d 1H) → Feature Engineering (11 indicadores)
  → Python GaussianHMM(7 states) → Voting Engine (8 confirmaciones)
    → LONG/CASH signal → Backtest ($10K × 2.5x leverage)
      → Equity Curve → MySQL → React Dashboard
```

### Indicadores técnicos computados

| Indicador | Parámetros |
|-----------|-----------|
| RSI | period=14 |
| MACD | EMA12/26, signal=9 |
| EMA50 / EMA200 | — |
| ADX | period=14 |
| Momentum | 12 períodos |
| Volatilidad | Rolling std 24h |
| Volume SMA | period=20 |

### 8 confirmaciones institucionales

| # | Confirmación | Umbral |
|---|-------------|--------|
| 1 | RSI | < 90 |
| 2 | Momentum | > 1% |
| 3 | Volatilidad | < 6% |
| 4 | Volumen | > SMA20 |
| 5 | ADX | > 25 |
| 6 | Precio > EMA50 | — |
| 7 | Precio > EMA200 | — |
| 8 | MACD > Signal | — |

**Regla de entrada:** Régimen bull + ≥ 7/8 confirmaciones  
**Regla de salida:** Régimen bear → exit + cooldown 48h

### Activos soportados (16 total)

| Categoría | Símbolos |
|-----------|----------|
| 🪙 Digital Assets | BTC-USD, ETH-USD, SOL-USD, ADA-USD, XRP-USD |
| 📊 ETFs | VOO, SCHH, ARTY, AU |
| 📈 Stocks | MSFT, GOOGL, QCOM, TSM, MARA, EC |

---

## 🚀 Instalación y Setup

### Requisitos

- Node.js ≥ 20.x
- pnpm ≥ 10.x
- Python ≥ 3.11
- MySQL 8.0

### 1. Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL=mysql://user:password@localhost:3306/bitacorastock
HMM_SERVICE_URL=http://localhost:8000

# OAuth (opcional, hay bypass para desarrollo local)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# LLM para análisis de sentimiento (opcional)
OPENAI_API_KEY=...

# Noticias (opcional)
NEWS_API_KEY=...
```

### 2. Base de datos

```bash
pnpm install
pnpm db:push
```

### 3. Servidor principal

```bash
pnpm dev
# → http://localhost:3001
```

### 4. Python HMM Microservice

```bash
cd hmm-service
pip install -r requirements.txt
python main.py
# → http://localhost:8000
```

### 5. Usar el HMM Dashboard

1. Navega a `http://localhost:3001/hmm-trading`
2. Verifica el badge **🟢 Python HMM: Online**
3. Selecciona el activo en el desplegable
4. Presiona **Run Backtest** (tarda ~30-60s en el primer run)

---

## 🐳 Docker Compose

```bash
docker-compose up --build
# App disponible en http://localhost:3001
```

---

## 🗄️ Esquema de Base de Datos

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios con OAuth y perfil de riesgo |
| `portfolios` | Portafolios de inversión |
| `investments` | Operaciones individuales |
| `portfolio_assets` | Activos dentro de cada portafolio |
| `monte_carlo_simulations` | Resultados de simulaciones |
| `recommendations` | Recomendaciones personalizadas |
| `portfolio_reports` | Reportes PDF generados |
| `notifications` | Notificaciones del sistema |
| `portfolio_history` | Historial de cambios de portafolios |
| `sentiment_analysis` | Análisis de sentimiento por portafolio |
| `sentiment_analysis_cache` | Caché con TTL para análisis de sentimiento |
| `user_sessions` | Sesiones activas por usuario |
| `investment_market_comments` | Comentarios de mercado por inversión |
| `hmm_trades` | Trades del sistema HMM |
| `hmm_equity_curve` | Curva de equity del backtest HMM |

---

## 📡 API tRPC — Procedures Principales

### HMM Trading (`hmm.*`)

| Procedure | Tipo | Descripción |
|-----------|------|-------------|
| `hmm.runBacktest` | mutation | Pipeline completo para un símbolo |
| `hmm.getCurrentSignal` | query | Señal LONG/CASH con voting score |
| `hmm.getPerformanceMetrics` | query | Return, Win Rate, Max Drawdown |
| `hmm.getEquityCurve` | query | Serie temporal de equity |
| `hmm.getTrades` | query | Historial de trades |
| `hmm.hmmServiceHealth` | query | Estado del microservicio Python |
| `hmm.getAssets` | query | Catálogo de activos disponibles |

### Portafolio (`portfolio.*`)
CRUD completo: crear, leer, actualizar, eliminar portafolios e inversiones.

### Monte Carlo (`simulation.*`)
Ejecutar simulaciones, obtener resultados, exportar PDF.

### Sentimiento (`sentiment.*`)
Analizar noticias, obtener sentimiento agregado, historial.

---

## 🛠️ Scripts

```bash
pnpm dev          # Servidor de desarrollo (tsx watch)
pnpm build        # Build de producción (Vite + esbuild)
pnpm start        # Servidor de producción
pnpm test         # Tests unitarios (Vitest)
pnpm check        # TypeScript check
pnpm db:push      # Generar y aplicar migración de DB
```

---

## 🧪 Tests

El proyecto tiene **99 tests unitarios** cubriendo:

- Servicios de caché de sentimiento
- Invalidación automática de caché en CRUD
- Endpoints CRUD de portafolios e inversiones
- Sesiones de usuario
- Simulación de Monte Carlo
- Análisis de recomendaciones

```bash
pnpm test
```

---

## 📄 Licencia

MIT © 2025 hegarciagg