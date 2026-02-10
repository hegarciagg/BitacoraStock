/**
 * mathEngine.js
 * Core financial calculations
 */

window.MathEngine = {
    
    /**
     * Calculate Log Returns: ln(P_t / P_{t-1})
     */
    calculateLogReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            const current = prices[i];
            const prev = prices[i-1];
            if (current && prev) {
                returns.push(Math.log(current / prev));
            } else {
                returns.push(0); // Handle missing data gracefully
            }
        }
        return returns;
    },

    /**
     * Calculate Mean Return (Annualized)
     * @param {number[]} returns - Array of log returns
     * @param {number} periods - Trading days (252)
     */
    calculateMean(returns, periods = 252) {
        const sum = returns.reduce((a, b) => a + b, 0);
        return (sum / returns.length) * periods;
    },

    /**
     * Calculate Covariance Matrix (Annualized)
     * @param {Object} returnsMap - Map of ticker -> returns array
     * @param {string[]} tickers
     * @param {number} periods
     */
    calculateCovarianceMatrix(returnsMap, tickers, periods = 252) {
        const n = tickers.length;
        const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
        const len = returnsMap[tickers[0]].length; // Assuming aligned

        // Pre-calculate means for covariance
        const means = {};
        tickers.forEach(t => {
            means[t] = returnsMap[t].reduce((a,b)=>a+b,0) / len;
        });

        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                const tickerA = tickers[i];
                const tickerB = tickers[j];
                const returnsA = returnsMap[tickerA];
                const returnsB = returnsMap[tickerB];

                let sum = 0;
                for (let k = 0; k < len; k++) {
                    sum += (returnsA[k] - means[tickerA]) * (returnsB[k] - means[tickerB]);
                }
                
                const cov = (sum / (len - 1)) * periods;
                matrix[i][j] = cov;
                matrix[j][i] = cov;
            }
        }
        return matrix;
    },

    /**
     * Calculate Standard Deviation (Annualized Volatility)
     */
    calculateStdDev(returns, periods = 252) {
        const mean = returns.reduce((a,b)=>a+b,0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
        return Math.sqrt(variance * periods);
    },

    /**
     * Calculate Correlation Matrix
     */
    calculateCorrelationMatrix(covMatrix, stdDevs) {
        const n = covMatrix.length;
        const matrix = Array(n).fill(0).map(() => Array(n).fill(0));

        for(let i=0; i<n; i++){
            for(let j=0; j<n; j++){
                matrix[i][j] = covMatrix[i][j] / (stdDevs[i] * stdDevs[j]);
            }
        }
        return matrix;
    },

    /**
     * Calculate Beta
     * Beta = Cov(Asset, Benchmark) / Var(Benchmark)
     */
    calculateBeta(assetReturns, benchmarkReturns) {
        const n = Math.min(assetReturns.length, benchmarkReturns.length);
        let sumA = 0, sumB = 0;
        
        for(let i=0; i<n; i++) {
            sumA += assetReturns[i];
            sumB += benchmarkReturns[i];
        }
        
        const meanA = sumA / n;
        const meanB = sumB / n;
        
        let cov = 0;
        let varB = 0;
        
        for(let i=0; i<n; i++) {
            cov += (assetReturns[i] - meanA) * (benchmarkReturns[i] - meanB);
            varB += Math.pow(benchmarkReturns[i] - meanB, 2);
        }
        
        if (varB === 0) return 0;
        return cov / varB;
    }
};
