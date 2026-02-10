/**
 * Motor de Decisión Profesional ORCA LP - Capa Lógica
 * 
 * Módulos:
 * 1. Capa de Datos: Obtiene datos históricos de precios
 * 2. Capa de Estrategia: Simula LP vs HODL
 * 3. Capa de Riesgo y Métricas: Calcula Sharpe, Drawdown, etc.
 * 4. Capa de Visualización y Alertas: Renderiza gráficos y alertas de texto
 */

// ==========================================
// 1. CAPA DE DATOS
// ==========================================

async function downloadPriceData(symbol, startDate) {
    const statusMsg = document.getElementById('statusMessage');
    
    // Convertir fecha de inicio a timestamp Unix
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(Date.now() / 1000); // Ahora
    
    // URL de la API de Yahoo Finance
    // Usando interval=1d (diario)
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
    
    // Proxy CORS Público (usando corsproxy.io como una opción pública confiable, o cors-anywhere demo)
    // Idealmente, un backend manejaría esto para evitar exponer claves API o depender de proxies públicos.
    // Para esta aplicación solo del lado del cliente, usamos un proxy público.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;

    console.log(`fetching: ${proxyUrl}`);

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.chart.result[0];
        
        if (!result) {
             throw new Error("Yahoo Finance returned no data.");
        }

        const timestamps = result.timestamp;
        const prices = result.indicators.quote[0].close; // Usar precios de cierre
        // const adjClose = result.indicators.adjclose[0].adjclose; // Yahoo a menudo separa el cierre ajustado

        // Combinar en un array limpio de objetos
        // Filtrar nulos (Yahoo a veces devuelve nulos para festivos/errores)
        const cleanData = timestamps.map((t, i) => ({
            date: new Date(t * 1000).toISOString().split('T')[0], // YYYY-MM-DD
            timestamp: t,
            price: prices[i]
        })).filter(item => item.price != null);

        console.log(`Yahoo Finance data download: SUCCESS. ${cleanData.length} records.`);
        return cleanData;

    } catch (error) {
        console.error("Yahoo Finance data download: FAILED", error);
        
        // Fallback o Alerta
        statusMsg.textContent = "⚠️ Data fetch failed. Check Symbol or CORS.";
        throw error;
    }
}

// ==========================================
// 2. CAPA DE ESTRATEGIA
// ==========================================

function simulateHodl(prices, capital) {
    if (!prices || prices.length === 0) return { equityCurve: [], finalEquity: 0 };
    
    const initialPrice = prices[0].price;
    const equityCurve = prices.map(p => {
        return capital * (p.price / initialPrice);
    });
    
    return { 
        equityCurve, 
        finalEquity: equityCurve[equityCurve.length - 1] 
    };
}

function simulateLPStrategy(prices, capitalLP, pLow, pHigh, fees24h, tvl) {
    if (!prices || prices.length === 0) return { equityCurve: [], feesGenerated: 0, finalEquity: 0, il: 0 };

    const initialPrice = prices[0].price;
    let accumulatedFees = 0;
    
    // Estimación de tasa de comisión diaria basada en parámetros de entrada
    // feeDaily = fees24h * (capitalLP / tvl)
    const dailyFeeRate = fees24h * (capitalLP / tvl);

    const equityCurve = prices.map((p, index) => {
        const price = p.price;
        
        // 1. Calcular Comisiones
        // Verificar si el precio está dentro del rango
        let feeToday = 0;
        if (price >= pLow && price <= pHigh) {
            feeToday = dailyFeeRate;
        }
        accumulatedFees += feeToday;

        // 2. Calcular Impermanent Loss (Modelo Genérico/Simplificado V2 relativo a HODL)
        // IL = 2 * sqrt(ratio) / (1 + ratio) - 1
        // ratio = price / initialPrice
        // Esto estima cuánto se rezaga el valor de la posición LP respecto a HODL puro
        const ratio = price / initialPrice;
        const ilFactor = (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
        
        // Valor si HODL
        const hodlValue = capitalLP * ratio;
        
        // Valor de la Posición LP (Principal) = Valor HODL * (1 + IL)
        // Nota: ilFactor es negativo, por lo que reduce el valor
        const lpPositionValue = hodlValue * (1 + ilFactor);
        
        // Equidad Total LP
        return lpPositionValue + accumulatedFees;
    });

    const finalLPEquity = equityCurve[equityCurve.length - 1];
    
    // Calcular valor absoluto final de IL para mostrar
    const finalRatio = prices[prices.length - 1].price / initialPrice;
    const finalHodlValue = capitalLP * finalRatio;
    const finalLPPositionValue = finalLPEquity - accumulatedFees;
    const impermanentLossParam = finalLPPositionValue - finalHodlValue; // Debería ser negativo

    // Cálculo de Tiempo en Rango (Time in Box)
    let daysInBox = 0;
    for(let p of prices) {
        if (p.price >= pLow && p.price <= pHigh) {
            daysInBox++;
        }
    }
    const timeInBoxPct = daysInBox / prices.length;

    return { 
        equityCurve, 
        feesGenerated: accumulatedFees, 
        finalEquity: finalLPEquity,
        il: impermanentLossParam,
        finalHodlEquity: finalHodlValue,
        timeInBox: timeInBoxPct,
        dailyFeeRate // retornado para proyección
    };
}

// ==========================================
// 3. CAPA DE RIESGO Y MÉTRICAS
// ==========================================

function calculateVolatility(prices) {
    if (!prices || prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / returns.length);
    return stdDev;
}

function calculateReturns(equityCurve) {
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
        const r = (equityCurve[i] - equityCurve[i-1]) / equityCurve[i-1];
        returns.push(r);
    }
    return returns;
}

function calculateSharpe(returns) {
    if (!returns || returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / returns.length);
    
    if (stdDev === 0) return 0;
    
    // Sharpe Anualizado (asumiendo datos diarios)
    return (Math.sqrt(365) * mean) / stdDev;
}

function calculateMaxDrawdown(equityCurve) {
    if (!equityCurve || equityCurve.length === 0) return 0;
    
    let maxPeak = equityCurve[0];
    let maxDrawdown = 0;
    
    for (let eq of equityCurve) {
        if (eq > maxPeak) {
            maxPeak = eq;
        }
        const drawdown = (eq - maxPeak) / maxPeak;
        if (drawdown < maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    return maxDrawdown; // Devuelve número negativo ej. -0.15
}

function calculateCVaR(returns, alpha = 0.05) {
    if (!returns || returns.length === 0) return 0;
    
    // Ordenar retornos ascendente
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Encontrar índice para percentil alpha
    const index = Math.floor(alpha * sortedReturns.length);
    if (index === 0) return sortedReturns[0];

    // Promedio de los peores alpha% casos
    const worstCases = sortedReturns.slice(0, index);
    const meanWrong = worstCases.reduce((a, b) => a + b, 0) / worstCases.length;
    
    return meanWrong;
}

function calculateAPY(startEquity, endEquity, days) {
    if (days === 0) return 0;
    const totalReturn = (endEquity - startEquity) / startEquity;
    // APY = (1 + totalReturn) ^ (365/days) - 1
    const apy = Math.pow(1 + totalReturn, 365 / days) - 1;
    return apy;
}

// ==========================================
// 4. CAPA DE VISUALIZACIÓN Y ALERTAS
// ==========================================

function lpAlertSystem(currentPrice, pLow, pHigh, apy, drawdown) {
    let priceStatus = "";
    let efficiencyStatus = "";
    let actionSignal = "";
    let alertClass = "alert-success";

    // 1. Verificación de Rango de Precio
    if (currentPrice >= pLow && currentPrice <= pHigh) {
        priceStatus = "✅ Price is INSIDE your current range";
        efficiencyStatus = "👍 Earning full fees";
        actionSignal = "🧊 HOLD: Strategy is working correctly";
    } else {
        priceStatus = "⚠️ Price is OUTSIDE your current range";
        efficiencyStatus = "🛑 Not earning fees (Inactive)";
        alertClass = "alert-warning";
        
        if (currentPrice < pLow) {
             actionSignal = "🔄 ACT: Price Dropped. Consider rebalancing lower.";
        } else {
             actionSignal = "🔄 ACT: Price Rallied. Consider rebalancing higher.";
        }
    }

    // 2. Verificación de Riesgo
    if (drawdown < -0.20) {
        actionSignal += "\n🚨 CRITICAL: Drawdown > 20%. Review macro thesis.";
        alertClass = "alert-warning"; // Asegurar color de advertencia
    }
    
    // lógica específica para la solicitud del prompt
    let signal = "HOLD";
    if (priceStatus.includes("OUTSIDE") || drawdown < -0.20) {
        signal = "REBALANCE";
    }

    return {
        text: `============================================================\n${priceStatus}\n${efficiencyStatus}\n${actionSignal}\n============================================================`,
        cssClass: alertClass,
        signal
    };
}

function generateTextReport(symbol, pLow, pHigh, currentPrice, timeInBox, apy, feesDailyAvg, projectedDailyFee, poolFees24h, il, finalLp, finalHodl, sharpe, maxDd, cvar, capital) {
    // Lógica de Rebalanceo / Estimaciones
    // Fórmula Personalizada: Rebalance_Cost = Swap_Fees + Opportunity_Cost
    // Swap_Fees = Capital_LP * swap_fee_rate (0.0005) * 2
    const swapFeeRate = 0.0005;
    const swapFees = capital * swapFeeRate * 2;
    
    // Opportunity_Cost = Daily_Fees_Earned (projected) * Rebalance_Days (1)
    const rebalanceDays = 1;
    const opportunityCost = projectedDailyFee * rebalanceDays;
    
    const rebalanceCost = swapFees + opportunityCost;

    // Expected Gain logic:
    // Projected Weekly Fees = Theoretical Daily Fee * 7
    // This assumes that if we rebalance, we are IN RANGE and earning the theoretical rate.
    const expectedGain = projectedDailyFee * 7;  
    
    // Cálculo de APY Personalizado por Solicitud de Usuario
    // APY_current (%) = (Daily_Fees_Earned × 365 × Time_In_Range) / Capital_LP × 100
    // feesDailyAvg es la tarifa diaria real ganada en promedio
    const currentApyVal = ((feesDailyAvg * 365 * timeInBox) / capital); 

    // Lógica de Decisión
    // 1. Si el Precio está FUERA de rango -> Rebalancear
    // 2. Si Drawdown > 20% -> Rebalancear/Parar (Seguridad)
    // 3. Si "Ganancia Esperada" > "Costo de Rebalanceo" Y estamos fuera de rago -> Rebalancear
    
    let action = "HOLD";
    const isOut = currentPrice < pLow || currentPrice > pHigh;
    const isCrisis = maxDd < -0.20;
    
    if (isOut) {
        if (expectedGain > rebalanceCost) {
            action = "REBALANCE";
        } else {
             action = "WAIT (Cost > Gain)";
        }
    } else if (isCrisis) {
        action = "REBALANCE (Risk Control)";
    } else {
        action = "HOLD";
    }

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    const fmtPct = (n) => (n * 100).toFixed(2) + "%";

    return `Downloading Yahoo Finance data...
✅ Yahoo Finance data download: SUCCESS


=====================================================================
 ORCA ${symbol} — LP DECISION ENGINE
=====================================================================

--- CURRENT RANGE ---
Range:        ${fmt(pLow)} — ${fmt(pHigh)}
Current Price:${fmt(currentPrice)}
Time in box:  ${fmtPct(timeInBox)}
APY:          ${fmtPct(currentApyVal)}

--- DECISION ---
Rebalance cost:   ${fmt(rebalanceCost)} (est. ${fmtPct(rebalanceCost/capital)})
Expected gain:    ${fmt(expectedGain)} (7d proj.)
⛔ ACTION: ${action}

--- FEES vs IL ---
💸 Daily Fees Earned:       ${fmt(feesDailyAvg)} (avg)
📉 Impermanent Loss:        ${fmt(il)}

============================================================
 LP ALERT SYSTEM
============================================================
✅ Price is ${isOut ? "OUTSIDE" : "INSIDE"} your current range
👍 ${!isOut ? "Range efficiency is acceptable" : "Range efficiency is LOW"}
🚨 SIGNAL: ${action} recommended

=== BACKTEST HISTÓRICO ===
💰 Equity final LP:    ${fmt(finalLp)}
📈 Equity final HODL:  ${fmt(finalHodl)}
📊 Sharpe Ratio:      ${sharpe.toFixed(2)}
📉 Max Drawdown:      ${fmtPct(maxDd)}
⚠️ CVaR 95% diario:   ${fmtPct(cvar)}
=====================================================================`;
}

let chartInstance = null;

function renderPriceRangeChart(canvasId, dates, prices, pLow, pHigh) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Preparar Anotación para Rangos
    const annotations = {
        lowLine: {
            type: 'line',
            yMin: pLow,
            yMax: pLow,
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
                content: 'Min Price',
                display: true,
                position: 'start'
            }
        },
        highLine: {
            type: 'line',
            yMin: pHigh,
            yMax: pHigh,
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
                content: 'Max Price',
                display: true,
                position: 'start'
            }
        },
        rangeBox: {
            type: 'box',
            yMin: pLow,
            yMax: pHigh,
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 0
        }
    };

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Asset Price',
                data: prices,
                borderColor: '#38bdf8', // accent color
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    labels: { color: '#94a3b8' }
                },
                annotation: {
                    annotations: annotations
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                }
            }
        }
    });
}

let perfChartInstance = null;

function renderPerformanceChart(canvasId, dates, lpEquity, hodlEquity) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (perfChartInstance) {
        perfChartInstance.destroy();
    }

    perfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'LP Strategy Equity',
                    data: lpEquity,
                    borderColor: '#22c55e', // Green
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'HODL Equity',
                    data: hodlEquity,
                    borderColor: '#94a3b8', // Grey
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                }
            }
        }
    });
}



// ==========================================
// 5. FLUJO DE EJECUCIÓN PRINCIPAL
// ==========================================

document.getElementById('runAnalysis').addEventListener('click', async () => {
    const symbol = document.getElementById('symbol').value;
    const capital = parseFloat(document.getElementById('capital').value);
    const pLow = parseFloat(document.getElementById('pLow').value);
    const pHigh = parseFloat(document.getElementById('pHigh').value);
    const fees24h = parseFloat(document.getElementById('fees24h').value);
    const tvl = parseFloat(document.getElementById('tvl').value);
    const startDate = document.getElementById('startDate').value;
    
    const statusMsg = document.getElementById('statusMessage');
    
    // Validación Simple
    if(!symbol || isNaN(capital) || isNaN(pLow) || isNaN(pHigh)) {
        statusMsg.textContent = "❌ Please check your inputs.";
        statusMsg.className = "status-message status-error";
        return;
    }

    // Feedback de UI
    statusMsg.textContent = "⏳ Downloading data & processing...";
    statusMsg.className = "status-message"; // reset class

    try {
        const priceData = await downloadPriceData(symbol, startDate);
        
        if (!priceData || priceData.length === 0) {
            throw new Error("No data returned from API");
        }
        
        statusMsg.textContent = "✅ Analysis Complete";
        statusMsg.className = "status-message status-success";
        
        // Prepare arrays for easy access
        const dates = priceData.map(d => d.date);
        const prices = priceData.map(d => d.price);

        // 1. Ejecutar Estrategias
        const lpResult = simulateLPStrategy(priceData, capital, pLow, pHigh, fees24h, tvl);
        // Podríamos ejecutar HODL para comparación si se necesita en el futuro
        // const hodlResult = simulateHodl(priceData, capital);

        // 2. Calcular Métricas
        const lpReturns = calculateReturns(lpResult.equityCurve);
        
        const sharpe = calculateSharpe(lpReturns);
        const maxDd = calculateMaxDrawdown(lpResult.equityCurve);
        const cvar = calculateCVaR(lpReturns, 0.05);
        
        // CORRECCIÓN APY: Usar Días Calendario en lugar de Longitud del Array (Días de Trading)
        const startDateObj = new Date(priceData[0].date);
        const endDateObj = new Date(priceData[priceData.length - 1].date);
        const diffTime = Math.abs(endDateObj - startDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const calendarDays = diffDays > 0 ? diffDays : 1;

        // Cálculo de APY personalizado por solicitud de usuario (Tarifas Diarias * 365 * TiempoEnRango) / Capital
        const dailyFeesAvg = lpResult.feesGenerated / calendarDays;
        const timeInBox = lpResult.timeInBox;
        const currentApyVal = ((dailyFeesAvg * 365 * timeInBox) / capital); 

        const totalReturn = (lpResult.finalEquity - capital) / capital;

        // Obtener precio actual (último precio) temprano para lógica de UI
        const currentPrice = priceData[priceData.length - 1].price;

        // 3. Actualizar UI - PORTFOLIO DASHBOARD
        // Helper de Formato de Moneda
        const fmt = (num) =>  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
        const fmtPct = (num) => (num * 100).toFixed(2) + "%";
        const fmtDec = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

        // -- Estadísticas de Encabezado --
        // Usuario solicitó que Balance sea Capital Inicial. "Total Value" (Header) debe coincidir.
        document.getElementById('val-total-value').textContent = fmt(capital);
        
        // Cálculo de Rango Óptimo (7 días) basado en Volatilidad
        // Usar los últimos 30 precios para calcular la volatilidad diaria reciente
        const last30Prices = prices.slice(-30);
        const dailyVol = calculateVolatility(last30Prices);
        const vol7d = dailyVol * Math.sqrt(7);
        
        const optMin = currentPrice * (1 - vol7d);
        const optMax = currentPrice * (1 + vol7d);
        
        // Actualizar UI de Rango Óptimo
        const valOptRange = document.getElementById('val-opt-range');
        if(valOptRange) valOptRange.innerText = `${fmtDec(optMin)} — ${fmtDec(optMax)}`;
        
        const valOptVol = document.getElementById('val-opt-vol');
        if(valOptVol) valOptVol.innerText = `Volatilidad (7d): ${(vol7d * 100).toFixed(2)}%`;
        
        const theoreticalDailyFee = fees24h * (capital / tvl); // Potencial teórico si está en rango
        
        // Est Yield 24h: Necesita ambos $ y %
        // dailyFeesAvg es el promedio histórico. 
        // También podemos usar "projectedDailyFee" para el rendimiento teórico si el precio actual está en el rango.
        // Usemos dailyFeesAvg como "Realizado/Est" por ahora para coincidir con la lógica de etiqueta "Est Yield"
        // o el uso de APY actual. La imagen muestra "$15.71 0.166%"
        // Usemos la tarifa diaria teórica actual si está en el rango, o 0 si está fuera.
        // de hecho la imagen dice "Est. Yield (24H)" -> usualmente implica ganancias teóricas actuales
        let estYield24hUSD = 0;
        let estYield24hPct = 0;
        
        if (currentPrice >= pLow && currentPrice <= pHigh) {
             estYield24hUSD = theoreticalDailyFee;
             estYield24hPct = (theoreticalDailyFee / capital); // daily %
        }
        
        document.getElementById('val-est-yield-24h').textContent = fmt(estYield24hUSD);
        // ¿Mostrar APY anual en el encabezado o Rendimiento Diario %? La imagen dice "0.166%" lo que parece diario (0.16% * 365 = 58% APY).
        // Mostremos el rendimiento diario % aquí para coincidir probablemente con el contexto de la imagen.
        document.getElementById('val-apy-24h').textContent = (estYield24hPct * 100).toFixed(3) + "%";
        
        // document.getElementById('val-pending-yield').textContent = fmt(lpResult.feesGenerated); // REMOVED

        // -- Tabla de Portafolio --
        document.getElementById('table-pool-name').textContent = symbol;
        
        // Balance = Capital Inicial (Solicitud de Usuario)
        document.getElementById('table-balance').textContent = fmt(capital); 
        
        // document.getElementById('table-pending').textContent = fmt(lpResult.feesGenerated); // REMOVED
        
        // Est Yield Combinado
        document.getElementById('table-est-yield').textContent = `${Object.is(estYield24hUSD, NaN) ? "$0.00" : fmt(estYield24hUSD)} (${(estYield24hPct*100).toFixed(3)}%)`;

        // Visualización de Rango
        document.getElementById('range-min').textContent = fmtDec(pLow);
        document.getElementById('range-max').textContent = fmtDec(pHigh);
        
        // Calcular Posición %
        let rangePct = 0;
        let statusText = "In Range";
        let statusClass = "badge-success"; // Podemos simular clases de badge si es necesario
        
        if (currentPrice < pLow) {
            rangePct = 0;
            statusText = "Out of Range (Low)";
        } else if (currentPrice > pHigh) {
            rangePct = 100;
             statusText = "Out of Range (High)";
        } else {
            rangePct = ((currentPrice - pLow) / (pHigh - pLow)) * 100;
        }
        
        document.getElementById('range-marker').style.left = `${rangePct}%`;
        document.getElementById('range-status').textContent = statusText;
        
        // Actualizar Celda de Precio
        document.getElementById('table-price').textContent = fmtDec(currentPrice);
        
        // Extraer segunda parte del símbolo si es posible (ej. "SOL-USD" -> "USD por SOL")
        let priceUnit = "USD";
        if (symbol.includes('-')) {
             const parts = symbol.split('-');
             if(parts.length > 1) priceUnit = `${parts[1]} per ${parts[0]}`;
        }
        document.getElementById('table-price-unit').textContent = priceUnit;

        // -- Métricas Suplementarias (Tarjetas Pequeñas) --
        document.getElementById('val-sharpe').textContent = sharpe.toFixed(2);
        document.getElementById('val-drawdown').textContent = fmtPct(maxDd);
        document.getElementById('val-il').textContent = fmt(lpResult.il);

        // 4. Alertas
        // Obtener precio actual (último precio) - YA DEFINIDO ARRIBA
        const alertData = lpAlertSystem(currentPrice, pLow, pHigh, currentApyVal, maxDd);
        
        const alertBox = document.getElementById('lpAlertBox');
        alertBox.textContent = alertData.text;
        alertBox.className = `alert-box ${alertData.cssClass}`;

        // 5. Generar Informe de Texto Detallado
        // const theoreticalDailyFee ya está definido arriba
        
        const reportText = generateTextReport(
            symbol, pLow, pHigh, currentPrice, 
            lpResult.timeInBox, currentApyVal, dailyFeesAvg, theoreticalDailyFee,
            fees24h, lpResult.il, 
            lpResult.finalEquity, lpResult.finalHodlEquity, 
            sharpe, maxDd, cvar, capital
        );
        document.getElementById('detailedReport').textContent = reportText;

        // 6. Renderizar Gráficos
        // 6. Renderizar Gráficos
        renderPriceRangeChart('priceChart', dates, prices, pLow, pHigh);
        
        // Renderizar Gráfico de Rendimiento
        // Necesitamos la curva HODL eficientemente. 
        // Ya calculamos finalHodlEquity en simulateLP pero no la curva completa.
        // Generemos rápidamente la curva HODL para el gráfico.
        const hodlCurve = prices.map(p => capital * (p / prices[0]));
        renderPerformanceChart('performanceChart', dates, lpResult.equityCurve, hodlCurve);

    } catch (error) {
        console.error(error);
        statusMsg.textContent = `❌ Error: ${error.message}`;
        statusMsg.className = "status-message status-error";
    }
});
