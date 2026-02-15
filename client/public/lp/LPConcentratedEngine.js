/**
 * =====================================================
 * Motor Matemático Formal de Concentrated Liquidity
 * (Uniswap V3 / Orca Whirlpools)
 * =====================================================
 *
 * Modelo base:
 *   x(P) = L * (1/√P  − 1/√Pb)     dentro del rango
 *   y(P) = L * (√P   − √Pa)         dentro del rango
 *   V(P) = x(P)·P + y(P)
 *
 * L se resuelve a partir del capital inicial C en precio P₀:
 *   L = C / (2√P₀ − P₀/√Pb − √Pa)
 */

const CLEngine = (() => {

    // ─────────────────────────────────────────────
    // Utilidades Core
    // ─────────────────────────────────────────────

    /**
     * Raíz cuadrada segura (clamp a 0).
     */
    function sqrt(p) {
        return Math.sqrt(Math.max(0, p));
    }

    // ─────────────────────────────────────────────
    // 1. Resolver Liquidity L
    // ─────────────────────────────────────────────

    /**
     * Calcula el parámetro de liquidez L a partir del capital inicial.
     *
     * Maneja tres casos según la posición de P₀ respecto al rango:
     *   - P₀ ≤ Pa : capital 100% en token base  → L = C / (P₀ · (1/√Pa − 1/√Pb))
     *   - P₀ ≥ Pb : capital 100% en token quote → L = C / (√Pb − √Pa)
     *   - Pa < P₀ < Pb : composición mixta       → L = C / (2√P₀ − P₀/√Pb − √Pa)
     *
     * @param {number} C   - Capital total (USD)
     * @param {number} P0  - Precio de entrada
     * @param {number} Pa  - Límite inferior del rango
     * @param {number} Pb  - Límite superior del rango
     * @returns {number}   - Parámetro de liquidez L
     */
    function calculateLiquidity(C, P0, Pa, Pb) {
        const sqrtP0 = sqrt(P0);
        const sqrtPa = sqrt(Pa);
        const sqrtPb = sqrt(Pb);

        let denominator;

        if (P0 <= Pa) {
            // Capital 100% en token base (x)
            // C = x · P0 = L · (1/√Pa − 1/√Pb) · P0
            denominator = P0 * (1 / sqrtPa - 1 / sqrtPb);
        } else if (P0 >= Pb) {
            // Capital 100% en token quote (y)
            // C = y = L · (√Pb − √Pa)
            denominator = sqrtPb - sqrtPa;
        } else {
            // Composición mixta dentro del rango
            // L = C / (2√P₀ − P₀/√Pb − √Pa)
            denominator = (2 * sqrtP0) - (P0 / sqrtPb) - sqrtPa;
        }

        if (denominator <= 0) {
            console.warn('[CLEngine] Denominador ≤ 0 en calculateLiquidity. Parámetros inválidos.');
            return 0;
        }

        return C / denominator;
    }

    // ─────────────────────────────────────────────
    // 2. Cantidades de Tokens en la Posición
    // ─────────────────────────────────────────────

    /**
     * Calcula las cantidades de token base (x) y token quote (y)
     * según el precio actual y los límites del rango.
     *
     * Caso 1: P ≤ Pa  → posición 100% en token base (x)
     * Caso 2: P ≥ Pb  → posición 100% en token quote (y)
     * Caso 3: Pa < P < Pb → composición mixta
     *
     * @param {number} L   - Parámetro de liquidez
     * @param {number} P   - Precio actual
     * @param {number} Pa  - Límite inferior
     * @param {number} Pb  - Límite superior
     * @returns {{ x: number, y: number }}
     */
    function positionAmounts(L, P, Pa, Pb) {
        const sqrtP  = sqrt(P);
        const sqrtPa = sqrt(Pa);
        const sqrtPb = sqrt(Pb);

        // Caso 1: Precio por debajo del rango → 100% token base
        if (P <= Pa) {
            return {
                x: L * (1 / sqrtPa - 1 / sqrtPb),
                y: 0
            };
        }

        // Caso 2: Precio por encima del rango → 100% token quote
        if (P >= Pb) {
            return {
                x: 0,
                y: L * (sqrtPb - sqrtPa)
            };
        }

        // Caso 3: Dentro del rango → composición mixta
        return {
            x: L * (1 / sqrtP - 1 / sqrtPb),
            y: L * (sqrtP - sqrtPa)
        };
    }

    // ─────────────────────────────────────────────
    // 3. Valor Total de la Posición
    // ─────────────────────────────────────────────

    /**
     * Valor total USD de la posición.
     * V = x · P + y
     *
     * @param {number} x - Cantidad de token base
     * @param {number} y - Cantidad de token quote
     * @param {number} P - Precio actual
     * @returns {number}
     */
    function positionValue(x, y, P) {
        return x * P + y;
    }

    // ─────────────────────────────────────────────
    // 4. Impermanent Loss
    // ─────────────────────────────────────────────

    /**
     * Calcula el Impermanent Loss como ratio.
     * IL = (V_LP / V_HODL) − 1
     *
     * Resultado negativo = pérdida vs HODL.
     *
     * @param {number} V_lp   - Valor de la posición LP
     * @param {number} V_hodl - Valor si hubiera hecho HODL
     * @returns {number}      - IL como fracción decimal (ej. -0.05 = -5%)
     */
    function impermanentLoss(V_lp, V_hodl) {
        if (V_hodl === 0) return 0;
        return (V_lp / V_hodl) - 1;
    }

    // ─────────────────────────────────────────────
    // 5. Análisis Completo de Posición
    // ─────────────────────────────────────────────

    /**
     * Flujo completo del Decision Engine para Concentrated Liquidity.
     *
     * Dado un capital C depositado en P₀ con rango [Pa, Pb],
     * calcula el estado de la posición si el precio se mueve a P_target.
     *
     * @param {number} C         - Capital inicial (USD)
     * @param {number} P0        - Precio de entrada
     * @param {number} Pa        - Límite inferior
     * @param {number} Pb        - Límite superior
     * @param {number} P_target  - Precio objetivo/actual
     * @returns {object}         - Resultado completo del análisis
     */
    function analyzePosition(C, P0, Pa, Pb, P_target) {
        const L = calculateLiquidity(C, P0, Pa, Pb);

        const initial = positionAmounts(L, P0, Pa, Pb);
        const target  = positionAmounts(L, P_target, Pa, Pb);

        const V_lp   = positionValue(target.x, target.y, P_target);
        const V_hodl = positionValue(initial.x, initial.y, P_target);

        const IL = impermanentLoss(V_lp, V_hodl);

        return {
            liquidity: L,
            initialAmounts: initial,
            targetAmounts: target,
            valueLP: V_lp,
            valueHodl: V_hodl,
            impermanentLoss: IL,
            impermanentLossUSD: V_lp - V_hodl,
            priceInRange: P_target > Pa && P_target < Pb
        };
    }

    // ─────────────────────────────────────────────
    // 6. Curva de IL vs Precio
    // ─────────────────────────────────────────────

    /**
     * Genera una curva de IL para un rango de precios.
     * Útil para visualizar el perfil de riesgo de la posición.
     *
     * @param {number}   C      - Capital inicial
     * @param {number}   P0     - Precio de entrada
     * @param {number}   Pa     - Límite inferior
     * @param {number}   Pb     - Límite superior
     * @param {number[]} prices - Array de precios a evaluar
     * @returns {{ prices: number[], ilPercent: number[], lpValues: number[], hodlValues: number[] }}
     */
    function calculateILCurve(C, P0, Pa, Pb, prices) {
        const L       = calculateLiquidity(C, P0, Pa, Pb);
        const initial = positionAmounts(L, P0, Pa, Pb);

        const ilPercent  = [];
        const lpValues   = [];
        const hodlValues = [];

        for (const P of prices) {
            const target = positionAmounts(L, P, Pa, Pb);
            const V_lp   = positionValue(target.x, target.y, P);
            const V_hodl = positionValue(initial.x, initial.y, P);

            lpValues.push(V_lp);
            hodlValues.push(V_hodl);
            ilPercent.push(V_hodl === 0 ? 0 : ((V_lp / V_hodl) - 1) * 100);
        }

        return { prices, ilPercent, lpValues, hodlValues };
    }

    // ─────────────────────────────────────────────
    // 7. Break-Even Fees (Fees mínimas diarias
    //    para compensar IL)
    // ─────────────────────────────────────────────

    /**
     * Calcula las fees diarias necesarias para compensar el IL
     * acumulado hasta un precio objetivo, asumiendo N días.
     *
     * @param {number} C         - Capital inicial
     * @param {number} P0        - Precio de entrada
     * @param {number} Pa        - Límite inferior
     * @param {number} Pb        - Límite superior
     * @param {number} P_target  - Precio objetivo
     * @param {number} days      - Horizonte temporal (default: 30)
     * @returns {{ dailyFeesNeeded: number, totalILUSD: number, annualizedAPYNeeded: number }}
     */
    function calculateBreakEvenFees(C, P0, Pa, Pb, P_target, days = 30) {
        const analysis = analyzePosition(C, P0, Pa, Pb, P_target);
        const ilUSD    = Math.abs(analysis.impermanentLossUSD);

        const dailyFeesNeeded     = days > 0 ? ilUSD / days : 0;
        const annualizedAPYNeeded = C > 0 ? (dailyFeesNeeded * 365) / C : 0;

        return {
            dailyFeesNeeded,
            totalILUSD: ilUSD,
            annualizedAPYNeeded
        };
    }

    // ─────────────────────────────────────────────
    // 8. Eficiencia de Rango
    // ─────────────────────────────────────────────

    /**
     * Calcula el factor de amplificación de capital vs full-range (V2).
     *
     * En un AMM V2, la liquidez se distribuye en [0, ∞).
     * En CL, se concentra en [Pa, Pb], amplificando la eficiencia.
     *
     * Factor ≈ 1 / (1 − √(Pa/Pb))   (simplificación)
     *
     * @param {number} Pa - Límite inferior
     * @param {number} Pb - Límite superior
     * @returns {number}  - Factor de amplificación (ej. 4.2x)
     */
    function rangeEfficiency(Pa, Pb) {
        if (Pb <= 0 || Pa < 0 || Pa >= Pb) return 1;
        const ratio = sqrt(Pa / Pb);
        const denom = 1 - ratio;
        if (denom <= 0) return Infinity;
        return 1 / denom;
    }

    // ─────────────────────────────────────────────
    // 9. Simulación CL sobre serie histórica
    // ─────────────────────────────────────────────

    /**
     * Simula la estrategia LP con Concentrated Liquidity
     * sobre una serie de precios históricos.
     *
     * @param {Array<{date: string, price: number}>} priceData - Serie histórica
     * @param {number} capital    - Capital inicial
     * @param {number} Pa         - Límite inferior
     * @param {number} Pb         - Límite superior
     * @param {number} fees24h    - Fees diarias estimadas del pool ($)
     * @param {number} tvl        - TVL del pool ($)
     * @returns {object}          - Resultado de la simulación
     */
    function simulateCLStrategy(priceData, capital, Pa, Pb, fees24h, tvl) {
        if (!priceData || priceData.length === 0) {
            return { equityCurve: [], feesGenerated: 0, finalEquity: 0, il: 0 };
        }

        const P0 = priceData[0].price;
        const L  = calculateLiquidity(capital, P0, Pa, Pb);

        // Cantidades iniciales de entrada
        const initialAmounts = positionAmounts(L, P0, Pa, Pb);

        // Tasa diaria de fees proporcional al capital del LP
        const dailyFeeRate = fees24h * (capital / tvl);

        let accumulatedFees = 0;
        let daysInBox = 0;

        const equityCurve = priceData.map((p) => {
            const price = p.price;

            // Acumular fees solo si el precio está dentro del rango
            let feeToday = 0;
            if (price >= Pa && price <= Pb) {
                feeToday = dailyFeeRate;
                daysInBox++;
            }
            accumulatedFees += feeToday;

            // Calcular valor de la posición LP con modelo CL formal
            const amounts = positionAmounts(L, price, Pa, Pb);
            const lpValue = positionValue(amounts.x, amounts.y, price);

            // Equity total = valor de posición + fees acumuladas
            return lpValue + accumulatedFees;
        });

        // Curva HODL consistente: mantener composición inicial (x₀, y₀) y revalorizar
        const hodlCurve = priceData.map((p) => {
            return positionValue(initialAmounts.x, initialAmounts.y, p.price);
        });

        // Valores finales
        const lastPrice     = priceData[priceData.length - 1].price;
        const finalAmounts   = positionAmounts(L, lastPrice, Pa, Pb);
        const finalLPValue   = positionValue(finalAmounts.x, finalAmounts.y, lastPrice);
        const finalHodlValue = positionValue(initialAmounts.x, initialAmounts.y, lastPrice);
        const finalEquity    = equityCurve[equityCurve.length - 1];

        const timeInBoxPct = daysInBox / priceData.length;
        const ilAbsolute   = finalLPValue - finalHodlValue;

        return {
            equityCurve,
            hodlCurve,
            feesGenerated: accumulatedFees,
            finalEquity,
            il: ilAbsolute,
            finalHodlEquity: finalHodlValue,
            timeInBox: timeInBoxPct,
            dailyFeeRate,
            liquidity: L,
            initialAmounts,
            finalAmounts
        };
    }

    // ─────────────────────────────────────────────
    // API Pública
    // ─────────────────────────────────────────────

    return {
        calculateLiquidity,
        positionAmounts,
        positionValue,
        impermanentLoss,
        analyzePosition,
        calculateILCurve,
        calculateBreakEvenFees,
        rangeEfficiency,
        simulateCLStrategy
    };

})();
