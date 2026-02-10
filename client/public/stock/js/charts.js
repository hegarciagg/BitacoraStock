/**
 * charts.js
 * Visualization using Plotly.js (Premium Edition + Step 10)
 */

window.Charts = {
    
    _darkLayout: {
        paper_bgcolor: 'rgba(0,0,0,0)', 
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e6edf3', family: "'Inter', sans-serif" },
        xaxis: { 
            gridcolor: 'rgba(255,255,255,0.05)', 
            zerolinecolor: 'rgba(255,255,255,0.1)',
            automargin: true,
            tickfont: { size: 10 }
        },
        yaxis: { 
            gridcolor: 'rgba(255,255,255,0.05)', 
            zerolinecolor: 'rgba(255,255,255,0.1)',
            automargin: true,
            tickfont: { size: 10 }
        },
        margin: { t: 40, r: 40, l: 40, b: 40 }, 
        showlegend: false, 
        autosize: true,
        hoverlabel: {
            bgcolor: '#161b22',
            bordercolor: '#30363d',
            font: { color: '#fff', size: 12 }
        }
    },

    _lightLayout: {
        paper_bgcolor: 'rgba(0,0,0,0)', 
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#1c1e21', family: "'Inter', sans-serif" },
        xaxis: { 
            gridcolor: 'rgba(0,0,0,0.05)', 
            zerolinecolor: 'rgba(0,0,0,0.1)',
            automargin: true,
            tickfont: { size: 10 }
        },
        yaxis: { 
            gridcolor: 'rgba(0,0,0,0.05)', 
            zerolinecolor: 'rgba(0,0,0,0.1)',
            automargin: true,
            tickfont: { size: 10 }
        },
        margin: { t: 40, r: 40, l: 40, b: 40 }, 
        showlegend: false, 
        autosize: true,
        hoverlabel: {
            bgcolor: '#fff',
            bordercolor: '#dddfe2',
            font: { color: '#1c1e21', size: 12 }
        }
    },

    getLayout() {
        const isLight = document.body.classList.contains('light-theme');
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        const base = isLight ? this._lightLayout : this._darkLayout;
        
        // Dynamic overrides for mobile/tablet
        return {
            ...base,
            font: { 
                ...base.font, 
                size: isSmallMobile ? 9 : (isMobile ? 10 : 11) 
            },
            margin: isSmallMobile 
                ? { t: 20, r: 10, l: 35, b: 35 } 
                : (isMobile ? { t: 30, r: 20, l: 40, b: 40 } : base.margin),
            xaxis: {
                ...base.xaxis,
                tickfont: { size: isSmallMobile ? 8 : 9 }
            },
            yaxis: {
                ...base.yaxis,
                tickfont: { size: isSmallMobile ? 8 : 9 }
            }
        };
    },

    _pConfig: {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d', 'sendDataToCloud'],
        displaylogo: false
    },

    drawNormalizedPrices(data, elementId) {
        console.log(`📊 Price Chart Refresh`);
        
        const colors = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#1f6feb', '#238636', '#da3633'];

        const traces = data.tickers.map((ticker, i) => {
            const prices = data.prices[ticker];
            const startPrice = prices.find(p => p !== null) || 1;
            const normalized = prices.map(p => p ? (p / startPrice) * 100 : null);
            
            return {
                x: data.dates,
                y: normalized,
                name: ticker,
                type: 'scatter',
                mode: 'lines',
                line: { width: 1.8, color: colors[i % colors.length] },
                hoverinfo: 'name+y'
            };
        });

        const labelTraces = data.tickers.map((ticker, i) => {
            const prices = data.prices[ticker];
            const startPrice = prices.find(p => p !== null) || 1;
            const lastIdx = prices.length - 1;
            const lastPriceNorm = (prices[lastIdx] / startPrice) * 100;
            
            return {
                x: [data.dates[lastIdx]],
                y: [lastPriceNorm],
                mode: 'markers+text',
                type: 'scatter',
                text: [`  ${ticker}`],
                textposition: 'middle right',
                textfont: { color: colors[i % colors.length], weight: 700, size: 11 },
                marker: { size: 6, color: colors[i % colors.length], line: { color: 'white', width: 1 } },
                hoverinfo: 'none'
            };
        });

        const layout = {
            ...this.getLayout(),
            xaxis: { ...this.getLayout().xaxis, type: 'date', range: [data.dates[0], data.dates[data.dates.length - 1]] },
            yaxis: {
                ...this.getLayout().yaxis,
                type: 'log',
                autorange: true,
                title: 'RELATIVE PERFORMANCE (BASE 100)'
            }
        };

        Plotly.purge(elementId);
        Plotly.newPlot(elementId, [...traces, ...labelTraces], layout, this._pConfig);
    },

    drawEfficientFrontier(simulations, optimal, tickers, elementId) {
        console.log(`📊 Frontier Refresh`);
        
        const maxPoints = 12000; 
        let points = simulations;
        if (simulations.length > maxPoints) {
            const step = Math.floor(simulations.length / maxPoints);
            points = simulations.filter((_, i) => i % step === 0).slice(0, maxPoints);
        }

        // Implementation of Algorithm Step 10: Top 3 assets by weight on hover
        const hoverTexts = points.map(p => {
            const assetWeights = tickers.map((t, i) => ({ ticker: t, weight: p.weights[i] }))
                                       .sort((a, b) => b.weight - a.weight)
                                       .slice(0, 3);
            
            const weightStrings = assetWeights.map(aw => `${aw.ticker}: ${(aw.weight * 100).toFixed(1)}%`).join('<br>');
            return `<b>Sharpe: ${p.sharpe.toFixed(3)}</b><br><br>Top Assets:<br>${weightStrings}`;
        });
        
        const traceScatter = {
            x: points.map(p => p.volatility),
            y: points.map(p => p.return),
            mode: 'markers',
            type: 'scattergl', 
            marker: {
                color: points.map(p => p.sharpe),
                colorscale: 'RdYlGn',
                colorbar: { 
                    title: 'SHARPE',
                    thickness: 10,
                    len: 0.5,
                    titlefont: { size: 10 },
                    tickfont: { size: 8 }
                },
                size: 1.8, 
                opacity: 0.7,
            },
            name: 'Simulations',
            text: hoverTexts,
            hoverinfo: 'text+x+y'
        };

        const traceMaxSharpe = {
            x: [optimal.maxSharpe.volatility],
            y: [optimal.maxSharpe.return],
            mode: 'markers+text',
            type: 'scatter',
            text: ['<b>MAX SHARPE</b>'],
            textposition: 'top center',
            marker: { 
                color: '#f2e318', 
                size: 14, 
                symbol: 'star', 
                line: { color: 'white', width: 2 } 
            },
            hoverinfo: 'none'
        };

        const traceMinVol = {
            x: [optimal.minVariance.volatility],
            y: [optimal.minVariance.return],
            mode: 'markers+text',
            type: 'scatter',
            text: ['<b>MIN VAR</b>'],
            textposition: 'bottom center',
            marker: { 
                color: '#00f2ff', 
                size: 14, 
                symbol: 'diamond', 
                line: { color: 'white', width: 2 } 
            },
            hoverinfo: 'none'
        };

        const layout = {
            ...this.getLayout(),
            xaxis: { title: 'ANNUAL VOLATILITY', ...this.getLayout().xaxis, type: 'linear' },
            yaxis: { title: 'EXPECTED RETURN', ...this.getLayout().yaxis, type: 'linear' },
            hovermode: 'closest'
        };

        Plotly.purge(elementId);
        Plotly.newPlot(elementId, [traceScatter, traceMaxSharpe, traceMinVol], layout, this._pConfig);
    },

    drawCorrelationMatrix(matrix, tickers, stats, elementId) {
        const trace = {
            z: matrix,
            x: tickers,
            y: tickers,
            type: 'heatmap',
            colorscale: [
                [0, '#f85149'],   
                [0.5, '#ffffff'], 
                [1, '#238636']    
            ],
            zmin: -1,
            zmax: 1,
            showscale: false,
            text: matrix.map(row => row.map(v => v.toFixed(2))),
            texttemplate: tickers.length < 15 ? "%{text}" : "",
            textfont: { size: 10, color: '#000' }
        };

        const layout = {
            ...this.getLayout(),
            xaxis: { ...this.getLayout().xaxis, type: 'category', side: 'bottom' },
            yaxis: { ...this.getLayout().yaxis, type: 'category', autorange: 'reversed' }
        };
        
        Plotly.purge(elementId);
        Plotly.newPlot(elementId, [trace], layout, this._pConfig);
    },

    drawBetas(betas, tickers, elementId) {
        const sorted = tickers.map((t, i) => ({ t, beta: parseFloat(betas[i]) }))
                               .sort((a, b) => a.beta - b.beta);
        
        const trace = {
            x: sorted.map(d => d.beta), 
            y: sorted.map(d => d.t),    
            type: 'bar',
            orientation: 'h',
            marker: { 
                color: sorted.map(d => d.beta),
                colorscale: [
                    [0, '#1f6feb'],   /* Institutional Blue */
                    [0.5, '#58a6ff'], /* Bright Blue */
                    [1, '#3fb950']    /* Green */
                ],
                line: { color: 'white', width: 0.5 }
            },
            text: sorted.map(d => d.beta.toFixed(2)),
            textposition: 'auto',
            textfont: { size: 10, weight: 700 }
        };

        const layout = {
            ...this.getLayout(),
            xaxis: { title: 'BETA COEFFICIENT', ...this.getLayout().xaxis, type: 'linear', zeroline: true },
            yaxis: { ...this.getLayout().yaxis, type: 'category' }
        };

        Plotly.purge(elementId);
        Plotly.newPlot(elementId, [trace], layout, this._pConfig);
    },
    
    drawHistoricalPerformance(data, maxSharpe, minVar, benchmark, elementId) {
        const dates = data.dates;
        const tickers = data.tickers;
        
        function getSeries(weights) {
            return dates.map((_, idx) => {
                let val = 0;
                tickers.forEach((t, i) => {
                    const priceStart = data.prices[t].find(p => p !== null) || 1;
                    val += weights[i] * (data.prices[t][idx] / priceStart) * 100;
                });
                return val;
            });
        }

        const isLight = document.body.classList.contains('light-theme');
        const benchColor = isLight ? 'rgba(28, 30, 33, 0.4)' : 'rgba(255, 255, 255, 0.3)';

        const traces = [
            {
                x: dates,
                y: getSeries(minVar.weights),
                name: 'MIN VARIANCE',
                mode: 'lines',
                line: { color: '#00f2ff', width: 2.5 }
            },
            {
                x: dates,
                y: getSeries(maxSharpe.weights),
                name: 'MAX SHARPE',
                mode: 'lines',
                line: { color: '#ff4b4b', width: 2.5 }
            }
        ];
        
        if (benchmark?.prices) {
             const start = benchmark.prices.find(p => p !== null) || 1;
             traces.push({
                 x: benchmark.dates,
                 y: benchmark.prices.map(p => (p/start)*100),
                 name: 'BENCHMARK (VOO)',
                 mode: 'lines',
                 line: { color: benchColor, dash: 'dot', width: 2 }
             });
        }

        const layout = {
             ...this.getLayout(),
             yaxis: { ...this.getLayout().yaxis, type: 'log', title: 'GROWTH (BASE 100)' },
             showlegend: true,
             legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0.5)', font: { size: 9 } }
        };
        
        Plotly.purge(elementId);
        Plotly.newPlot(elementId, traces, layout, this._pConfig);
    }
};
