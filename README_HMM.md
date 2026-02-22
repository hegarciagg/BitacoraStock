# HMM Trading System — Setup Guide

Sistema de trading algorítmico basado en Hidden Markov Models (HMM) para detección de regímenes de mercado en BTC-USD.

## Arquitectura

```
React Dashboard (/hmm-trading)
      ↓ tRPC
Express Backend (port 3001)
      ↓ HTTP POST
Python HMM Microservice (port 8000)  ← GaussianHMM(7 states)
      ↓ MySQL
hmm_trades + hmm_equity_curve tables
```

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20.x |
| pnpm    | 10.x |
| Python  | 3.11 |
| MySQL   | 8.0  |
| Docker  | 24.x (opcional) |

## Setup Local (sin Docker)

### 1. Variables de entorno

Crea un archivo `.env` en la raíz:
```env
DATABASE_URL=mysql://user:password@localhost:3306/bitacorastock
HMM_SERVICE_URL=http://localhost:8000
```

### 2. Base de datos

```bash
pnpm db:push
```

Esto crea las tablas `hmm_trades` y `hmm_equity_curve` (junto a las demás).

### 3. Iniciar Python HMM Microservice

```bash
cd hmm-service
pip install -r requirements.txt
python main.py
```

El servicio corre en `http://localhost:8000`. Puedes verificar con:
```bash
curl http://localhost:8000/health
```

### 4. Iniciar el servidor principal

```bash
pnpm dev
```

La app corre en `http://localhost:3001`.

### 5. Usar el dashboard

1. Navega a `http://localhost:3001/hmm-trading`
2. Verifica que el badge **"Python HMM: Online"** aparezca verde
3. Haz clic en **"Run Backtest"**
4. Espera ~30-60s (el primer HMM fit tarda)
5. Los resultados aparecen automáticamente

## Setup con Docker Compose

```bash
docker-compose up --build
```

La app queda disponible en `http://localhost:3001`.

## API Endpoints (tRPC)

| Procedure | Tipo | Descripción |
|---|---|---|
| `hmm.runBacktest` | mutation | Ejecuta pipeline completo y persiste resultados |
| `hmm.getCurrentSignal` | query | Señal actual (LONG/CASH) con voting score |
| `hmm.getPerformanceMetrics` | query | Total Return, Win Rate, Max Drawdown |
| `hmm.getEquityCurve` | query | Serie temporal de equity (hasta 10k puntos) |
| `hmm.getTrades` | query | Últimos N trades con PnL y regime |
| `hmm.hmmServiceHealth` | query | Estado del microservicio Python |

## Python Microservice API

### POST /detect-regimes
```json
{
  "returns":       [0.012, -0.003, ...],
  "range":         [0.021, 0.015, ...],
  "volVolatility": [0.003, -0.11, ...]
}
```
Respuesta:
```json
{
  "states":             [3, 3, 1, 5, ...],
  "bullState":          3,
  "bearState":          1,
  "meanReturnsByState": [0.001, -0.005, 0.002, ...]
}
```

## Parámetros del Sistema

| Parámetro | Valor |
|---|---|
| HMM States | 7 |
| Covariance type | full |
| Iterations | 1000 |
| Capital inicial | $10,000 |
| Leverage | 1.3x |
| Confirmaciones mínimas | 7/8 |
| Cooldown post-bear | 48 horas |
| Data BTC | 1H, últimos 730 días |
