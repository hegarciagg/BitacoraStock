/*
 * monteCarlo.worker.js
 * High-performance portfolio simulation
 */

self.onmessage = function(e) {
    const { meanReturns, covMatrix, numPortfolios, riskFreeRate, assetCount } = e.data;
    
    // Chunk size for reporting progress
    const CHUNK_SIZE = 5000;
    let count = 0;
    
    // Arrays to hold results (Float32 for memory efficiency)
    // Structure: [Return, Volatility, Sharpe, w1, w2, ..., wn]
    // But sending massive arrays can be slow. Better to just track optimals?
    // User wants Efficient Frontier visualization, so we need ALL points (or a large sample).
    // Let's send chunks of points.
    
    let resultsChunk = [];

    // Helper: Matrix multiplication w^T * Cov * w
    // Optimized for 1D arrays simulating 2D matrix
    // CovMatrix is usually symmetric
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

    // Simulation Loop
    for (let i = 0; i < numPortfolios; i++) {
        // Generate random weights
        let weights = new Float32Array(assetCount);
        let sum = 0;
        
        for (let j = 0; j < assetCount; j++) {
            const val = Math.random();
            weights[j] = val;
            sum += val;
        }

        // Normalize
        for (let j = 0; j < assetCount; j++) {
            weights[j] = weights[j] / sum;
        }

        // Metrics
        const portReturn = getPortfolioReturn(weights, meanReturns);
        const portVol = getPortfolioVol(weights, covMatrix);
        const sharpe = (portReturn - riskFreeRate) / portVol;

        resultsChunk.push({
            return: portReturn,
            volatility: portVol,
            sharpe: sharpe,
            weights: Array.from(weights) // Convert back to normal array for transfer
        });

        count++;

        // Send chunk check
        if (count % CHUNK_SIZE === 0 || i === numPortfolios - 1) {
            self.postMessage({
                type: 'chunk',
                data: resultsChunk,
                progress: count / numPortfolios
            });
            resultsChunk = []; // Reset chunk
        }
    }

    self.postMessage({ type: 'done' });
};
