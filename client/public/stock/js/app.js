class App {
    constructor() {
        console.log("⚡ QuantEngine: Initializing Premium Dashboard...");
        
        // Internal state
        this.dataService = new window.DataService();
        this.portfolioEngine = new window.PortfolioEngine(window.MathEngine);
        this.selectedAssets = new Set(['VOO', 'AU', 'MSFT', 'GOOGL', 'TSM', 'EC', 'BTC-USD', 'ETH-USD', 'SOL-USD']);
        this.customTickers = new Set();
        this.assetCategories = this.initAssetCategories();
        this.tooltip = this.initTooltip();
        
        this.init();
    }

    initAssetCategories() {
        const cats = {};
        window.CONFIG.ASSETS.ETF.forEach(t => cats[t] = 'Portfolio Essentials');
        window.CONFIG.ASSETS.STOCKS.forEach(t => cats[t] = 'Growth & Tech');
        window.CONFIG.ASSETS.CRYPTO.forEach(t => cats[t] = 'Digital Assets');
        return cats;
    }

    initTooltip() {
        let el = document.getElementById('quant-tooltip');
        if (!el) {
            el = document.createElement('div');
            el.id = 'quant-tooltip';
            el.className = 'quant-tooltip';
            document.body.appendChild(el);
        }
        return el;
    }

    showTooltip(e, ticker) {
        const meta = window.CONFIG.METADATA[ticker];
        if (!meta) return;

        this.tooltip.innerHTML = `
            <span class="tooltip-title">${meta.name}</span>
            <span class="tooltip-desc">${meta.desc}</span>
        `;
        
        this.tooltip.style.display = 'block';
        
        // Position
        const x = e.clientX + 15;
        const y = e.clientY + 15;
        
        // Boundary check
        const width = this.tooltip.offsetWidth;
        const height = this.tooltip.offsetHeight;
        
        let finalX = x;
        let finalY = y;
        
        if (x + width > window.innerWidth) finalX = e.clientX - width - 15;
        if (y + height > window.innerHeight) finalY = e.clientY - height - 15;
        
        this.tooltip.style.left = `${finalX}px`;
        this.tooltip.style.top = `${finalY}px`;
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    init() {
        try {
            this.loadTheme();
            this.setDefaultDates();
            this.renderAssetSelector();
            this.bindEvents();
            this.updateStatus('Ready to Analyze', 'ready');
            console.log("✅ QuantEngine: Ready.");
        } catch (err) {
            console.error("❌ QuantEngine: Initialization failed:", err);
            this.updateStatus('System Error', 'error');
        }
    }

    setDefaultDates() {
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 3); // 3 years for better performance/relevance
        
        document.getElementById('start-date').value = start.toISOString().split('T')[0];
        document.getElementById('end-date').value = end.toISOString().split('T')[0];
    }

    renderAssetSelector() {
        const container = document.getElementById('asset-selector');
        if (!container) return;
        container.innerHTML = '';

        const categories = ['Portfolio Essentials', 'Growth & Tech', 'Digital Assets', 'Custom Assets'];
        const grouped = categories.reduce((acc, cat) => ({ ...acc, [cat]: [] }), {});

        // Use a Set to ensure unique tickers across all sources
        const allTickers = new Set([
            ...Object.keys(this.assetCategories),
            ...this.customTickers
        ]);

        allTickers.forEach(ticker => {
            const cat = this.assetCategories[ticker] || 'Custom Assets';
            if (grouped[cat]) grouped[cat].push(ticker);
        });

        categories.forEach(catName => {
            const assets = grouped[catName];
            if (assets.length === 0 && catName === 'Custom Assets') return;

            const label = document.createElement('div');
            label.className = 'group-tag';
            label.textContent = catName;
            container.appendChild(label);

            assets.forEach(ticker => {
                const el = document.createElement('div');
                el.className = 'asset-item';

                // Metadata for tooltips and names
                const meta = window.CONFIG.METADATA[ticker];
                
                el.addEventListener('mouseenter', (e) => this.showTooltip(e, ticker));
                el.addEventListener('mousemove', (e) => this.showTooltip(e, ticker));
                el.addEventListener('mouseleave', () => this.hideTooltip());

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = ticker;
                checkbox.checked = this.selectedAssets.has(ticker);
                
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) this.selectedAssets.add(ticker);
                    else this.selectedAssets.delete(ticker);
                    this.updateRunButton();
                });

                const content = document.createElement('div');
                content.className = 'asset-item-content';
                
                // Show ticker and name if available
                const nameText = meta ? `<div class="asset-name-sub">${meta.name}</div>` : '';
                content.innerHTML = `
                    <div class="asset-info-stack">
                        <span class="asset-ticker-text">${ticker}</span>
                        ${nameText}
                    </div>
                `;

                const actions = document.createElement('div');
                actions.className = 'asset-actions';

                // Category Selector
                const catSelect = document.createElement('select');
                catSelect.className = 'category-select';
                categories.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    opt.selected = (this.assetCategories[ticker] || 'Custom Assets') === c;
                    catSelect.appendChild(opt);
                });
                catSelect.addEventListener('change', (e) => this.changeAssetCategory(ticker, e.target.value));

                // Delete Button
                const delBtn = document.createElement('button');
                delBtn.className = 'delete-asset-btn';
                delBtn.innerHTML = '&times;';
                delBtn.title = 'Remove Asset';
                delBtn.addEventListener('click', () => this.deleteAsset(ticker));

                actions.appendChild(catSelect);
                actions.appendChild(delBtn);

                el.appendChild(checkbox);
                el.appendChild(content);
                el.appendChild(actions);
                
                // Track element for animations
                el.id = `asset-item-${ticker}`;
                
                container.appendChild(el);
            });
        });

        this.updateRunButton();
    }

    deleteAsset(ticker) {
        if (confirm(`Remove ${ticker} from the list?`)) {
            const el = document.getElementById(`asset-item-${ticker}`);
            if (el) {
                el.classList.add('deleting');
                setTimeout(() => {
                    this.selectedAssets.delete(ticker);
                    this.customTickers.delete(ticker);
                    delete this.assetCategories[ticker];
                    this.renderAssetSelector();
                }, 300); // Match CSS animation duration
            } else {
                this.selectedAssets.delete(ticker);
                this.customTickers.delete(ticker);
                delete this.assetCategories[ticker];
                this.renderAssetSelector();
            }
        }
    }

    changeAssetCategory(ticker, newCat) {
        this.assetCategories[ticker] = newCat;
        this.renderAssetSelector();
    }

    bindEvents() {
        document.getElementById('run-btn').addEventListener('click', () => this.runAnalysis());
        
        // Add Ticker Logic
        const addBtn = document.getElementById('add-ticker-btn');
        const input = document.getElementById('custom-ticker');
        
        const handleAdd = async () => {
            const ticker = input.value.trim().toUpperCase();
            
            // Check if ticker already exists (predefined or custom)
            const isPredefined = Object.keys(this.assetCategories).includes(ticker);
            const isCustom = this.customTickers.has(ticker);

            if (ticker && !isPredefined && !isCustom) {
                this.updateStatus(`Fetching info for ${ticker}...`, 'ready');
                try {
                    const meta = await this.dataService.fetchMetadata(ticker);
                    window.CONFIG.METADATA[ticker] = meta;
                } catch (err) {
                    console.warn("Metadata fetch error:", err);
                }
                
                this.customTickers.add(ticker);
                this.selectedAssets.add(ticker);
                input.value = '';
                this.renderAssetSelector();
                this.updateStatus('Ready', 'ready');
            } else if (ticker) {
                // Flash feedback if already exists
                this.updateStatus(`${ticker} ALREADY IN LIST`, 'ready');
                input.classList.add('input-error-shake');
                setTimeout(() => {
                    this.updateStatus('Ready', 'ready');
                    input.classList.remove('input-error-shake');
                }, 2000);
            }
        };

        addBtn.addEventListener('click', handleAdd);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAdd();
        });

        // Theme Toggle
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    loadTheme() {
        const theme = localStorage.getItem('quant-theme') || 'dark';
        if (theme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            this.updateThemeButton();
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.contains('light-theme');
        if (isLight) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('quant-theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('quant-theme', 'light');
        }
        this.updateThemeButton();
        
        // Redraw charts if results exist
        if (this.lastResults) {
            this.onSimulationComplete(this.lastResults, this.lastMarketData, this.lastBenchSeries);
        }
    }

    updateThemeButton() {
        const btn = document.getElementById('theme-btn');
        if (!btn) return;
        const isLight = document.body.classList.contains('light-theme');
        btn.querySelector('.theme-icon').textContent = isLight ? '☀️' : '🌙';
        btn.innerHTML = `<span class="theme-icon">${isLight ? '☀️' : '🌙'}</span> ${isLight ? 'Light Mode' : 'Dark Mode'}`;
    }

    updateRunButton() {
        const btn = document.getElementById('run-btn');
        const count = this.selectedAssets.size;
        btn.disabled = count < 2;
        btn.textContent = count < 2 ? `Add More Assets` : `Analyze ${count} Assets`;
    }

    updateStatus(text, type) {
        const badge = document.getElementById('status-indicator');
        badge.textContent = text;
        
        // Reset classes but keep base
        badge.className = 'status-badge';
        if (type) badge.classList.add(type);
        
        // Add special effect for completion
        if (text === 'Analysis Synced') {
            badge.classList.add('sync-glow');
            badge.style.transform = 'scale(1.1)';
            setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
        }
    }

    async runAnalysis() {
        const btn = document.getElementById('run-btn');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const progressPct = document.getElementById('progress-pct');
        const progressText = document.getElementById('progress-text');
        
        const startVal = document.getElementById('start-date').value;
        const endVal = document.getElementById('end-date').value;
        const simCount = parseInt(document.getElementById('sim-count').value) || 400000;
        
        // Update global config with user preference
        window.CONFIG.SIMULATION.NUM_PORTFOLIOS = simCount;

        const dateRange = { start: new Date(startVal), end: new Date(endVal) };

        btn.disabled = true;
        this.updateStatus('Synchronizing...', 'ready');
        progressContainer.classList.remove('hidden');
        this.setLoading(5, 'Fetching Market Data');

        try {
            const selectedTickers = Array.from(this.selectedAssets);
            const fetchList = Array.from(new Set([...selectedTickers, window.CONFIG.BENCHMARK]));
            
            const data = await this.dataService.fetchMarketData(fetchList, dateRange);
            this.setLoading(15, 'Vectorizing Indices');
            
            // Display record count
            const statsEl = document.getElementById('data-stats');
            const countEl = document.getElementById('record-count');
            if (statsEl && countEl) {
                countEl.textContent = data.totalRecords.toLocaleString();
                statsEl.classList.remove('hidden');
            }
            
            const validSelectedTickers = selectedTickers.filter(t => data.prices[t] != null);
            if (validSelectedTickers.length < 2) {
                throw new Error('Need at least 2 valid historical datasets');
            }

            const dataForCharts = { ...data, tickers: validSelectedTickers };
            window.Charts.drawNormalizedPrices(dataForCharts, 'price-history-chart');
            
            this.setLoading(25, 'Calculating Covariance Matrix');

            const returnsMap = {};
            const means = [];
            const stdDevs = []; 
            
            validSelectedTickers.forEach(t => {
                const rets = window.MathEngine.calculateLogReturns(data.prices[t]);
                returnsMap[t] = rets;
                means.push(window.MathEngine.calculateMean(rets));
                stdDevs.push(window.MathEngine.calculateStdDev(rets));
            });

            const covMatrix = window.MathEngine.calculateCovarianceMatrix(returnsMap, validSelectedTickers);
            const corrMatrix = window.MathEngine.calculateCorrelationMatrix(covMatrix, stdDevs);
            window.Charts.drawCorrelationMatrix(corrMatrix, validSelectedTickers, null, 'correlation-chart');

            const benchPrices = data.prices[window.CONFIG.BENCHMARK];
            if (benchPrices) {
                const benchRets = window.MathEngine.calculateLogReturns(benchPrices);
                const betas = validSelectedTickers.map(t => window.MathEngine.calculateBeta(returnsMap[t], benchRets));
                window.Charts.drawBetas(betas, validSelectedTickers, 'beta-chart');
            }

            this.updateStatus('Optimizing Assets', 'ready');
            this.portfolioEngine.setCallbacks(
                (progress) => {
                    const totalPct = 25 + (progress * 0.75);
                    this.setLoading(totalPct, `Simulating: ${Math.floor(progress)}%`);
                },
                (results) => {
                    const benchSeries = { dates: data.dates, prices: data.prices[window.CONFIG.BENCHMARK] };
                    this.lastResults = results;
                    this.lastMarketData = dataForCharts;
                    this.lastBenchSeries = benchSeries;
                    this.onSimulationComplete(results, dataForCharts, benchSeries);
                    
                    // Sync with Database
                    if (window.SyncService) {
                        window.SyncService.syncStockAnalysis(results);
                    }

                    btn.disabled = false;
                    this.updateStatus('Analysis Synced', 'ready');
                    setTimeout(() => progressContainer.classList.add('hidden'), 3000);
                }
            );

            this.portfolioEngine.runSimulation(window.CONFIG.SIMULATION, { means }, covMatrix, window.CONFIG.RISK_FREE_RATE);

        } catch (err) {
            console.error("❌ Analysis Failed:", err);
            this.updateStatus('Analysis Failed', 'error');
            btn.disabled = false;
            progressContainer.classList.add('hidden');
            alert("Error: " + err.message);
        }
    }

    setLoading(pct, text) {
        document.getElementById('progress-bar').style.width = `${pct}%`;
        document.getElementById('progress-pct').textContent = `${Math.floor(pct)}%`;
        document.getElementById('progress-text').textContent = text;
    }

    onSimulationComplete(results, marketData, benchSeries) {
        if (!results.maxSharpe) return;

        const tickers = marketData.tickers;
        window.Charts.drawEfficientFrontier(results.simulations, results, tickers, 'frontier-chart');
        window.Charts.drawHistoricalPerformance(marketData, results.maxSharpe, results.minVariance, benchSeries, 'performance-chart');

        document.getElementById('max-sharpe-val').textContent = results.maxSharpe.sharpe.toFixed(3);
        document.getElementById('min-vol-val').textContent = (results.minVariance.volatility * 100).toFixed(2) + '%';
        document.getElementById('max-return-val').textContent = (results.maxSharpe.return * 100).toFixed(2) + '%';
        
        this.renderResultsTable(results, tickers);
    }

    renderResultsTable(results, tickers) {
        const tbody = document.getElementById('results-table-body');
        tbody.innerHTML = '';

        const metrics = [
            { label: 'Simulation Index', key: 'index', format: v => `#${v}` },
            { label: 'Expected Return', key: 'return', format: v => (v * 100).toFixed(2) + '%' },
            { label: 'Target Volatility', key: 'volatility', format: v => (v * 100).toFixed(2) + '%' },
            { label: 'Sharpe Efficiency', key: 'sharpe', format: v => v.toFixed(3) }
        ];

        metrics.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${m.label}</td>
                            <td>${m.format(results.maxSharpe[m.key])}</td>
                            <td>${m.format(results.minVariance[m.key])}</td>`;
            tbody.appendChild(tr);
        });

        tickers.forEach((ticker, i) => {
            const tr = document.createElement('tr');
            tr.className = 'weight-row';
            const wMax = results.maxSharpe.weights[i];
            const wMin = results.minVariance.weights[i];
            
            const renderWeight = w => {
                const cls = w < 0.04 ? 'weight-val-red' : '';
                return `<span class="${cls}">${(w * 100).toFixed(2)}%</span>`;
            };

            tr.innerHTML = `<td style="color: var(--text-secondary)">${ticker} Alpha</td>
                            <td>${renderWeight(wMax)}</td>
                            <td>${renderWeight(wMin)}</td>`;
            tbody.appendChild(tr);
        });
    }
}

window.addEventListener('load', () => { window.app = new App(); });
