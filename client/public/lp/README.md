# ORCA LP Professional Decision Engine

## Overview
This is a professional-grade web application for simulating Liquidity Provider (LP) strategies. It uses historical data to calculate expected returns, risks, and provides actionable alerts.

## Quick Start
1.  **Open** the `index.html` file in your web browser (Chrome, Firefox, Edge).
2.  **No installation required**. The app runs entirely in the browser.

## Features
-   **Historical Data**: Connects to Yahoo Finance.
-   **LP Logic**: Simulates Uniswap v3-style concentrated liquidity with fee accrual and Impermanent Loss.
-   **Risk Metrics**: Sharpe Ratio, Drawdown, VaR.
-   **Visualization**: Interactive price charts with range overlays.

## Security Note
This app uses a public CORS proxy to fetch data. For production use, replace the proxy with a dedicated backend service.

## Tech Stack
-   HTML5, CSS3, Vanilla JavaScript
-   Chart.js (Visualization)
