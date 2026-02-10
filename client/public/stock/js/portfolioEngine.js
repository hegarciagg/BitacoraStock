window.PortfolioEngine = class {
    constructor(mathEngine) {
        this.math = mathEngine;
        this.worker = null;
        this.simulations = [];
        this.isRunning = false;
        
        // Callbacks
        this.onProgress = () => {};
        this.onComplete = () => {};

        // Inlined Worker Logic for file:// compatibility
        this.workerCode = `
            self.onmessage = function(e) {
                const { meanReturns, covMatrix, numPortfolios, riskFreeRate, assetCount } = e.data;
                const CHUNK_SIZE = 5000;
                let count = 0;
                let resultsChunk = [];

                function getPortfolioVol(weights, covMatrix) {
                    let variance = 0;
                    for (let i = 0; i < assetCount; i++) {
                        for (let j = 0; j < assetCount; j++) {
                            variance += weights[i] * weights[j] * covMatrix[i][j];
                        }
                    }
                    return Math.sqrt(variance);
                }

                function getPortfolioReturn(weights, means) {
                    let ret = 0;
                    for (let i = 0; i < assetCount; i++) {
                        ret += weights[i] * means[i];
                    }
                    return ret;
                }

                for (let i = 0; i < numPortfolios; i++) {
                    let weights = new Float32Array(assetCount);
                    let sum = 0;
                    for (let j = 0; j < assetCount; j++) {
                        const val = Math.random();
                        weights[j] = val;
                        sum += val;
                    }
                    for (let j = 0; j < assetCount; j++) {
                        weights[j] = weights[j] / sum;
                    }

                    const portReturn = getPortfolioReturn(weights, meanReturns);
                    const portVol = getPortfolioVol(weights, covMatrix);
                    const sharpe = (portReturn - riskFreeRate) / portVol;

                    resultsChunk.push({
                        return: portReturn,
                        volatility: portVol,
                        sharpe: sharpe,
                        weights: Array.from(weights)
                    });

                    count++;
                    if (count % CHUNK_SIZE === 0 || i === numPortfolios - 1) {
                        self.postMessage({
                            type: 'chunk',
                            data: resultsChunk,
                            progress: count / numPortfolios
                        });
                        resultsChunk = [];
                    }
                }
                self.postMessage({ type: 'done' });
            };
        `;
    }

    setCallbacks(onProgress, onComplete) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
    }

    runSimulation(config, returnsData, covMatrix, riskFreeRate) {
        if (this.isRunning) return;

        this.simulations = [];
        this.isRunning = true;
        
        if (this.worker) this.worker.terminate();

        // Create Worker from Blob
        const blob = new Blob([this.workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.worker = new Worker(workerUrl);

        this.worker.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'chunk') {
                this.simulations.push(...msg.data);
                this.onProgress(msg.progress * 100);
            } else if (msg.type === 'done') {
                this._finishSimulation(riskFreeRate);
                URL.revokeObjectURL(workerUrl);
            }
        };

        const assetCount = covMatrix.length;
        this.worker.postMessage({
            meanReturns: returnsData.means,
            covMatrix: covMatrix,
            numPortfolios: config.NUM_PORTFOLIOS,
            riskFreeRate: riskFreeRate,
            assetCount: assetCount
        });
    }

    _finishSimulation(riskFreeRate) {
        this.isRunning = false;
        this.worker.terminate();
        this.worker = null;

        let maxSharpe = -Infinity;
        let minVol = Infinity;
        let maxSharpePort = null;
        let minVolPort = null;

        this.simulations.forEach((p, idx) => {
            if (p.sharpe > maxSharpe) {
                maxSharpe = p.sharpe;
                maxSharpePort = { ...p, index: idx + 1 };
            }
            if (p.volatility < minVol) {
                minVol = p.volatility;
                minVolPort = { ...p, index: idx + 1 };
            }
        });

        this.onComplete({
            simulations: this.simulations,
            maxSharpe: maxSharpePort,
            minVariance: minVolPort
        });
    }
}
