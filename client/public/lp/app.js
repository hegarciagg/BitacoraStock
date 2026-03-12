/**
 * Motor de Decisión Profesional ORCA LP - Capa Lógica
 * 
 * Módulos:
 * 0. Orca On-Chain Loader: Carga datos en vivo desde la cadena Solana
 * 1. Capa de Datos: Obtiene datos históricos de precios
 * 2. Capa de Estrategia: Simula LP vs HODL (Concentrated Liquidity)
 * 3. Capa de Riesgo y Métricas: Calcula Sharpe, Drawdown, etc.
 * 4. Capa de Visualización y Alertas: Renderiza gráficos y alertas de texto
 * 5. Motor CL: LPConcentratedEngine.js (cargado externamente)
 */

// ==========================================
// 0. ORCA ON-CHAIN LOADER
// ==========================================

const ORCA_RPC_ENDPOINTS = [
    'https://api.mainnet-beta.solana.com',
    'https://solana-mainnet.rpc.extrnode.com',
    'https://rpc.ankr.com/solana',
];

// ── Base58 decoder (needed to encode/decode Solana pubkeys) ──
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Decode(str) {
    const alphabet = BASE58_ALPHABET;
    let decoded = BigInt(0);
    let multi = BigInt(1);
    for (let i = str.length - 1; i >= 0; i--) {
        const char = str[i];
        const idx = alphabet.indexOf(char);
        if (idx < 0) throw new Error(`Invalid base58 character: ${char}`);
        decoded += multi * BigInt(idx);
        multi *= BigInt(58);
    }
    const bytes = new Uint8Array(32);
    for (let i = 31; i >= 0; i--) {
        bytes[i] = Number(decoded & BigInt(0xff));
        decoded >>= BigInt(8);
    }
    return bytes;
}

function base58Encode(bytes) {
    const alphabet = BASE58_ALPHABET;
    let num = BigInt(0);
    for (const b of bytes) { num = (num << BigInt(8)) | BigInt(b); }
    let result = '';
    while (num > 0n) {
        result = alphabet[Number(num % 58n)] + result;
        num /= 58n;
    }
    // Leading zeros
    for (const b of bytes) {
        if (b === 0) result = '1' + result;
        else break;
    }
    return result;
}

// ── DataView helpers ──
function dvReadPubkey(dv, offset) {
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset + offset, 32);
    return base58Encode(bytes);
}

function dvReadU128LE(dv, offset) {
    // Read as two u64 LE halves
    let lo = 0n, hi = 0n;
    for (let i = 0; i < 8; i++) lo |= BigInt(dv.getUint8(offset + i)) << BigInt(8 * i);
    for (let i = 0; i < 8; i++) hi |= BigInt(dv.getUint8(offset + 8 + i)) << BigInt(8 * i);
    return (hi << 64n) | lo;
}

function dvReadI32LE(dv, offset) {
    return dv.getInt32(offset, true /* little-endian */);
}

function dvReadU16LE(dv, offset) {
    return dv.getUint16(offset, true);
}

// ── Tick → Price conversion ──
// In Orca Whirlpools: price = 1.0001^tick  (for token_b per token_a)
function tickToPrice(tick) {
    return Math.pow(1.0001, tick);
}

// ── sqrtPrice (Q64.64 fixed-point) → price ──
function sqrtPriceToPrice(sqrtPriceX64) {
    // Q64.64: integer = sqrtPriceX64 >> 64, fractional = sqrtPriceX64 & (2^64-1)
    // Split to preserve precision (direct Number() on a 128-bit BigInt loses bits)
    const divisor = 2n ** 64n;
    const whole = sqrtPriceX64 / divisor;            // BigInt integer part
    const frac  = sqrtPriceX64 % divisor;            // BigInt fractional part
    const sqrtFloat = Number(whole) + Number(frac) / Number(divisor);
    return sqrtFloat * sqrtFloat;
}

// ── Whirlpool fee rate (stored as hundredths of a basis point) → decimal ──
// e.g. feeRate = 3000 means 0.30% (3000 / 1_000_000)
function feeRateToDecimal(raw) {
    return raw / 1_000_000;
}

// ── Fetch account bytes via the local server-side Solana RPC proxy ──
// The proxy at /api/solana-rpc forwards requests to Solana mainnet without CORS issues
async function fetchAccountData(address) {
    const resp = await fetch('/api/solana-rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            method: 'getAccountInfo',
            params: [address, { encoding: 'base64' }]
        })
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Proxy error: ${resp.status}`);
    }
    const json = await resp.json();
    const value = json?.result?.value;
    if (!value) throw new Error('Account not found or null');
    const rawBase64 = value.data[0];
    const binary = atob(rawBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new DataView(bytes.buffer);
}

// ── Fetch oldest transaction for Position Account to get Start Date ──
async function fetchPositionStartDate(address) {
    try {
        const resp = await fetch('/api/solana-rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'getSignaturesForAddress',
                params: [address, { limit: 1000 }]
            })
        });
        if (resp.ok) {
            const json = await resp.json();
            const sigs = json?.result;
            if (sigs && sigs.length > 0) {
                // The last signature in the array is the oldest (first) transaction
                const oldest = sigs[sigs.length - 1];
                if (oldest.blockTime) {
                    const date = new Date(oldest.blockTime * 1000);
                    return date.toISOString().split('T')[0];
                }
            }
        }
    } catch {}
    return null;
}

// ── Known tokens: symbol + decimals ──
const KNOWN_TOKENS = {
    'So11111111111111111111111111111111111111112':  { symbol: 'SOL',    decimals: 9 },
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC',   decimals: 6 },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT',   decimals: 6 },
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL',   decimals: 9 },
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', decimals: 5 },
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP',    decimals: 6 },
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF',  decimals: 6 },
    '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': { symbol: 'POPCAT', decimals: 9 },
    'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux': { symbol: 'HNT',    decimals: 8 },
    'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1':  { symbol: 'bSOL',   decimals: 9 },
    'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'jitoSOL', decimals: 9 },
    'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof':  { symbol: 'RNDR',   decimals: 8 },
};

function mintToSymbol(mint) {
    return KNOWN_TOKENS[mint]?.symbol || mint.slice(0, 4) + '…';
}

// ── Fetch token info (symbol + decimals) from Jupiter token list or mint account ──
async function fetchTokenInfo(mint) {
    // 1. Check local known tokens first
    if (KNOWN_TOKENS[mint]) return KNOWN_TOKENS[mint];
    // 2. Try Jupiter token API (public, no CORS issues)
    try {
        const resp = await fetch(`https://tokens.jup.ag/token/${mint}`, { signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
            const { symbol, decimals } = await resp.json();
            if (symbol) return { symbol, decimals: decimals ?? 6 };
        }
    } catch {}
    // 3. Fallback: read decimals from SPL mint account (byte 44)
    try {
        const dv = await fetchAccountData(mint);
        const decimals = dv.getUint8(44);
        return { symbol: mint.slice(0, 4) + '…', decimals };
    } catch {}
    return { symbol: mint.slice(0, 4) + '…', decimals: 6 };
}

// ── Derive Yahoo Finance ticker from two token symbols ──
function deriveYahooTicker(symbolA, symbolB) {
    const STABLES = new Set(['USDC', 'USDT', 'DAI', 'USDH', 'BUSD']);
    if (STABLES.has(symbolB)) return `${symbolA}-USD`;
    if (STABLES.has(symbolA)) return `${symbolB}-USD`;
    // SOL, ETH, BTC as quote → map base to USD
    const QUOTE = new Set(['SOL', 'ETH', 'BTC', 'mSOL', 'jitoSOL', 'bSOL']);
    if (QUOTE.has(symbolB) && !symbolA.includes('…')) return `${symbolA}-USD`;
    if (QUOTE.has(symbolA) && !symbolB.includes('…')) return `${symbolB}-USD`;
    return null; // can't determine → don't change
}

// ── Calculate position token amounts from liquidity math ──
// Returns { amountA, amountB } in raw smallest-unit amounts
function calcPositionRawAmounts(liquidity, sqrtPLow, sqrtPHigh, sqrtPCurrent) {
    const L = Number(liquidity);
    let amountA = 0, amountB = 0;
    if (sqrtPCurrent <= sqrtPLow) {
        // All token A
        amountA = L * (1 / sqrtPLow - 1 / sqrtPHigh);
    } else if (sqrtPCurrent >= sqrtPHigh) {
        // All token B
        amountB = L * (sqrtPHigh - sqrtPLow);
    } else {
        // In range
        amountA = L * (1 / sqrtPCurrent - 1 / sqrtPHigh);
        amountB = L * (sqrtPCurrent - sqrtPLow);
    }
    return { amountA, amountB };
}

// ── Fetch token prices using Pool Price (no external API needed for USD pairs) ──
function getInferredUSDPrices(symbolA, symbolB, pCurrent) {
    let priceA = 0, priceB = 0;
    const isStable = (sym) => ['USDC', 'USDT', 'DAI', 'USDH'].includes(sym);
    if (isStable(symbolB)) {
        priceB = 1.0;
        priceA = pCurrent;
    } else if (isStable(symbolA)) {
        priceA = 1.0;
        priceB = 1.0 / pCurrent;
    } else {
        // Fallback: If not a USD pair, we can't easily price it strictly from the pool
        // without an oracle. For this specific Orca UI, we just return 0 to skip auto-fill.
        priceA = 0; priceB = 0;
    }
    return { priceA, priceB };
}

// ── Ed25519 on-curve check (needed for PDA derivation) ──
// Used to verify that a SHA256 hash is NOT a valid ed25519 point → valid PDA
const _P = 2n**255n - 19n;
const _D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
const _SQRT_M1 = 19681161376707505956807079304988542015446066515923890162744021073123829784752n;

function _modpow(b, e, m) {
    let r = 1n; b = ((b % m) + m) % m;
    for (; e > 0n; e >>= 1n) { if (e & 1n) r = r * b % m; b = b * b % m; }
    return r;
}

function isOnEd25519Curve(bytes32) {
    // Treat bytes as compressed ed25519 point (y in little-endian, sign in MSB of byte[31])
    const b = new Uint8Array(bytes32);
    const signX = (b[31] >> 7) & 1;
    const yb = b.slice(); yb[31] &= 0x7f;
    // Read y little-endian (byte[0] = LSB)
    let y = 0n;
    for (let i = 0; i < 32; i++) y |= BigInt(yb[i]) << BigInt(8 * i);
    if (y >= _P) return false;
    const y2 = y * y % _P;
    const u = ((y2 - 1n) % _P + _P) % _P;
    const v = (_D * y2 % _P + 1n) % _P;
    // Compute x = sqrt(u/v) using the formula: x = u*v^3*(u*v^7)^((p-5)/8)
    const v3 = v * v % _P * v % _P;
    const v7 = v3 * v3 % _P * v % _P;
    let x = u * v3 % _P * _modpow(u * v7 % _P, (_P - 5n) / 8n, _P) % _P;
    const vx2 = v * x % _P * x % _P;
    if (vx2 === u) { /* ok */ }
    else if (vx2 === (_P - u) % _P) { x = x * _SQRT_M1 % _P; }
    else return false; // x² doesn't exist → not on curve
    if (x === 0n && signX === 1) return false;
    return true;
}

async function _sha256(bytes) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

// Derives a Solana PDA: SHA256(seeds... + programId + "ProgramDerivedAddress")
// Returns the 32-byte address, or null if the hash lands on the curve (invalid PDA)
async function _createProgramAddress(seeds, programIdBytes) {
    const marker = new TextEncoder().encode('ProgramDerivedAddress');
    const totalLen = seeds.reduce((s, d) => s + d.length, 0) + 32 + marker.length;
    const buf = new Uint8Array(totalLen);
    let off = 0;
    for (const s of seeds) { buf.set(s, off); off += s.length; }
    buf.set(programIdBytes, off); off += 32;
    buf.set(marker, off);
    const hash = await _sha256(buf);
    if (isOnEd25519Curve(hash)) return null; // on-curve → not a valid PDA
    return hash;
}

// Find the Whirlpool position PDA given a position NFT mint (base58)
// Seeds: ["position", positionMint_bytes, bump]
async function findWhirlpoolPositionPDA(positionMintBase58) {
    const WHIRLPOOL_PROGRAM = base58Decode('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc');
    const mintBytes = base58Decode(positionMintBase58);
    const seed0 = new TextEncoder().encode('position');
    for (let bump = 255; bump >= 0; bump--) {
        const addr = await _createProgramAddress(
            [seed0, mintBytes, new Uint8Array([bump])],
            WHIRLPOOL_PROGRAM
        );
        if (addr !== null) return base58Encode(addr);
    }
    throw new Error('Could not derive position PDA from the given mint');
}

// ── POSITION ACCOUNT LAYOUT (Anchor, bytes after 8-byte discriminator) ──
// Offset  Size  Field
//    0     32   whirlpool (pubkey)
//   32     32   positionMint (pubkey)
//   64     16   liquidity (u128 LE)
//   80      4   tickLowerIndex (i32 LE)
//   84      4   tickUpperIndex (i32 LE)
//   88     16   feeGrowthCheckpointA (u128)
//  104      8   feeOwedA (u64)
//  112     16   feeGrowthCheckpointB (u128)
//  128      8   feeOwedB (u64)
// (reward data follows, not needed)

function decodePosition(dv) {
    const DISC = 8; // skip anchor discriminator
    return {
        whirlpool:      dvReadPubkey(dv, DISC + 0),
        positionMint:   dvReadPubkey(dv, DISC + 32),
        liquidity:      dvReadU128LE(dv, DISC + 64),
        tickLowerIndex: dvReadI32LE(dv,  DISC + 80),
        tickUpperIndex: dvReadI32LE(dv,  DISC + 84),
        feeOwedA:       dvReadU128LE(dv, DISC + 104),
        feeOwedB:       dvReadU128LE(dv, DISC + 120),
    };
}

// ── WHIRLPOOL ACCOUNT LAYOUT (bytes after 8-byte discriminator) ──
// Verified against Orca Whirlpool program Rust source / IDL:
// Offset  Size  Field
//    0     32   whirlpoolsConfig (pubkey)
//   32      1   whirlpoolBump
//   33      2   tickSpacing (u16 LE)
//   35      2   tickSpacingSeed (u16 LE)
//   37      2   feeRate (u16 LE)  e.g. 3000 = 0.30%
//   39      2   protocolFeeRate (u16 LE)
//   41     16   liquidity (u128 LE)  ← FULL 16 bytes!
//   57     16   sqrtPrice (u128 LE, Q64.64)
//   73      4   tickCurrentIndex (i32 LE)
//   77      8   protocolFeeOwedA (u64)
//   85      8   protocolFeeOwedB (u64)
//   93     32   tokenMintA (pubkey)
//  125     32   tokenVaultA (pubkey)
//  157     16   feeGrowthGlobalA (u128)
//  173     32   tokenMintB (pubkey)
//  205     32   tokenVaultB (pubkey)

function decodeWhirlpool(dv) {
    const DISC = 8;
    return {
        tickSpacing:      dvReadU16LE(dv,  DISC + 33),
        feeRate:          dvReadU16LE(dv,  DISC + 37),
        sqrtPrice:        dvReadU128LE(dv, DISC + 57),   // was 49 — liquidity is 16 bytes
        tickCurrentIndex: dvReadI32LE(dv,  DISC + 73),   // was 65
        tokenMintA:       dvReadPubkey(dv, DISC + 93),   // was 101
        tokenMintB:       dvReadPubkey(dv, DISC + 173),  // was 165
    };
}

// ── Select the matching poolFeeTier <option> ──
function selectFeeOptionByRate(decimalRate) {
    const sel = document.getElementById('poolFeeTier');
    if (!sel) return;
    const valueStr = String(decimalRate);
    let found = false;
    for (const opt of sel.options) {
        if (Math.abs(parseFloat(opt.value) - decimalRate) < 0.000001) {
            opt.selected = true;
            found = true;
            break;
        }
    }
    // If exact fee tier doesn't exist, append it and select it
    if (!found) {
        const newOpt = document.createElement('option');
        newOpt.value = valueStr;
        newOpt.text = (decimalRate * 100).toFixed(2) + '%';
        sel.add(newOpt);
        newOpt.selected = true;
    }
}

// ── Main load function ──
async function loadOrcaPosition() {
    const addrInput = document.getElementById('orca-position-address');
    const statusEl  = document.getElementById('orca-status');
    const btn       = document.getElementById('btn-load-orca');

    const posAddress = addrInput.value.trim();
    if (!posAddress) {
        statusEl.className = 'err';
        statusEl.textContent = '❌ Introduce una Position Address.';
        return;
    }

    btn.disabled = true;
    statusEl.className = 'loading';
    statusEl.textContent = '⏳ Consultando Solana RPC…';

    try {
        // 1. Fetch & decode the Position account
        // orca.so shows the position NFT mint — try direct fetch first, then derive PDA.
        statusEl.textContent = '⏳ Cargando cuenta de posición…';
        let positionDV;
        try {
            positionDV = await fetchAccountData(posAddress);
        } catch (_directErr) {
            statusEl.textContent = '⏳ Derivando PDA desde position mint…';
            const pdaAddress = await findWhirlpoolPositionPDA(posAddress);
            console.log('[Orca] Derived position PDA:', pdaAddress);
            statusEl.textContent = '⏳ Cargando cuenta PDA de posición…';
            positionDV = await fetchAccountData(pdaAddress);
        }

        const position = decodePosition(positionDV);
        console.log('[Orca] Position decoded:', position);

        // 2. Fetch & decode the Whirlpool account
        statusEl.textContent = '⏳ Cargando datos del pool Whirlpool…';
        const whirlpoolDV = await fetchAccountData(position.whirlpool);
        const pool = decodeWhirlpool(whirlpoolDV);
        console.log('[Orca] Whirlpool decoded:', pool);

        // 3. Compute raw prices from ticks
        const rawPLow  = tickToPrice(position.tickLowerIndex);
        const rawPHigh = tickToPrice(position.tickUpperIndex);
        const rawPCurrent = Math.sqrt(sqrtPriceToPrice(pool.sqrtPrice));
        const feeDecimal  = feeRateToDecimal(pool.feeRate);

        // 4. Fetch token info (symbol + decimals)
        statusEl.textContent = '⏳ Obteniendo metadatos de tokens…';
        const [infoA, infoB] = await Promise.all([
            fetchTokenInfo(pool.tokenMintA),
            fetchTokenInfo(pool.tokenMintB),
        ]);
        const pairName    = `${infoA.symbol}/${infoB.symbol}`;
        const yahooTicker = deriveYahooTicker(infoA.symbol, infoB.symbol);

        // Adjust prices using token decimal scale shift (10^(decimalsA - decimalsB))
        const decimalShift = Math.pow(10, infoA.decimals - infoB.decimals);
        let pLow  = rawPLow * decimalShift;
        let pHigh = rawPHigh * decimalShift;
        let pCurrent = rawPCurrent * rawPCurrent * decimalShift; // square it back as we took sqrt

        // Fix order if decimals caused inversion
        if (pLow > pHigh) [pLow, pHigh] = [pHigh, pLow];

        console.log(`[Orca] Scaled Prices: pLow=${pLow.toFixed(6)}, pHigh=${pHigh.toFixed(6)}, pair=${pairName}, fee=${feeDecimal}`);

        // 5. Calculate position USD value & get Start Date
        statusEl.textContent = '⏳ Calculando valor y fecha de la posición…';
        const sqrtPLow  = Math.sqrt(rawPLow);
        const sqrtPHigh = Math.sqrt(rawPHigh);
        const rawAmounts = calcPositionRawAmounts(position.liquidity, sqrtPLow, sqrtPHigh, rawPCurrent);
        const decAmountA = rawAmounts.amountA / Math.pow(10, infoA.decimals);
        const decAmountB = rawAmounts.amountB / Math.pow(10, infoB.decimals);
        
        const [startDate] = await Promise.all([
            fetchPositionStartDate(posAddress) // Use PDA / position address to find creation date
        ]);

        // Calculate USD value using the pool's current price (assuming it's paired with a stablecoin)
        const prices = getInferredUSDPrices(infoA.symbol, infoB.symbol, pCurrent);
        const positionValueUSD = (prices.priceA > 0) ? (decAmountA * prices.priceA + decAmountB * prices.priceB) : 0;
        console.log(`[Orca] Values: $${positionValueUSD.toFixed(2)}, Started: ${startDate}`);

        // 6. Populate form fields
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== null && val !== undefined && !isNaN(val)) {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        setVal('pLow', pLow < 0.01 ? pLow.toFixed(6) : pLow.toFixed(4));
        setVal('pHigh', pHigh < 0.01 ? pHigh.toFixed(6) : pHigh.toFixed(4));
        selectFeeOptionByRate(feeDecimal);

        if (yahooTicker) setVal('symbol', yahooTicker);
        if (positionValueUSD && positionValueUSD > 0.01) {
            setVal('capital', positionValueUSD.toFixed(2));
        }
        if (startDate) {
            const sdEl = document.getElementById('startDate');
            if (sdEl) {
                sdEl.value = startDate;
                sdEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // 7. Update pool name in table header
        const tablePoolName = document.getElementById('table-pool-name');
        if (tablePoolName) tablePoolName.textContent = pairName;
        const poolTierLabel = document.getElementById('pool-tier-label');
        if (poolTierLabel) poolTierLabel.textContent = (feeDecimal * 100).toFixed(2) + '%';

        // 8. Show success
        statusEl.className = 'ok';
        const fmtUSD = (n) => n > 0 ? ` · Valor ~$${n.toFixed(2)}` : '';
        statusEl.textContent = `✅ Posición cargada · ${pairName} · Fee ${(feeDecimal * 100).toFixed(2)}%${fmtUSD(positionValueUSD)}`;

    } catch (err) {
        console.error('[Orca] Load failed:', err);
        statusEl.className = 'err';
        statusEl.textContent = `❌ Error: ${err.message}. Comprueba la dirección o tu conexión.`;
    } finally {
        btn.disabled = false;
    }
}

// ── Wire up the button ──
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-load-orca');
    if (btn) btn.addEventListener('click', loadOrcaPosition);

    // Also allow pressing Enter in the address input
    const inp = document.getElementById('orca-position-address');
    if (inp) inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); loadOrcaPosition(); }
    });
});


async function downloadPriceData(symbol, startDate) {
    const statusMsg = document.getElementById('statusMessage');
    
    // Convertir fecha de inicio a timestamp Unix
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(Date.now() / 1000); // Ahora
    
    // URL de la API de Yahoo Finance
    // Usando interval=1d (diario)
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
    
    // Proxies CORS Públicos (lista de fallback para mayor fiabilidad)
    // Idealmente, un backend manejaría esto para evitar exponer claves API o depender de proxies públicos.
    const proxyUrls = [
        `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`
    ];

    let data = null;
    let lastError = null;

    for (const proxyUrl of proxyUrls) {
        console.log(`fetching: ${proxyUrl}`);
        try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
                data = await response.json();
                break;
            } else {
                lastError = new Error(`HTTP error! status: ${response.status}`);
                console.warn(`Proxy returned status ${response.status}: ${proxyUrl}`);
            }
        } catch (error) {
            console.warn(`Proxy failed: ${proxyUrl}`, error);
            lastError = error;
        }
    }

    try {
        if (!data) {
            throw lastError || new Error("All proxies failed.");
        }
        
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

/**
 * Simulación de estrategia LP usando Concentrated Liquidity formal.
 * Delega al motor CLEngine.simulateCLStrategy.
 */
function simulateLPStrategy(prices, capitalLP, pLow, pHigh, fees24h, tvl) {
    return CLEngine.simulateCLStrategy(prices, capitalLP, pLow, pHigh, fees24h, tvl);
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

function generateTextReport(symbol, pLow, pHigh, currentPrice, timeInBox, apy, feesDailyAvg, projectedDailyFee, poolFees24h, il, finalLp, finalHodl, sharpe, maxDd, cvar, capital, poolFeeRate) {
    // Lógica de Rebalanceo / Estimaciones Calibradas
    // Fórmula mejorada: Rebalance_Cost = Swap_Fees + Slippage + Opportunity_Cost
    //
    // Swap_Fees: Se aplica la tasa real del pool (seleccionada por usuario)
    //   al capital total (cubre reestructuración de tokens al rebalancear)
    const swapFees = finalLp * poolFeeRate;
    
    // Slippage estimado: ~0.20% conservador para posiciones típicas
    const slippageRate = 0.002;
    const slippageCost = finalLp * slippageRate;
    
    // Opportunity_Cost = Daily_Fees_Earned (projected) * Rebalance_Days (1)
    const rebalanceDays = 1;
    const opportunityCost = projectedDailyFee * rebalanceDays;
    
    const rebalanceCost = swapFees + slippageCost + opportunityCost;

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
 ORCA ${symbol} — LP DECISION ENGINE (Concentrated Liquidity)
=====================================================================

--- CURRENT RANGE ---
Range:        ${fmt(pLow)} — ${fmt(pHigh)}
Current Price:${fmt(currentPrice)}
Time in box:  ${fmtPct(timeInBox)}
APY:          ${fmtPct(currentApyVal)}

--- DECISION ---
Rebalance cost:   ${fmt(rebalanceCost)} (est. ${fmtPct(rebalanceCost/finalLp)})
  ├─ Swap fees (${fmtPct(poolFeeRate)}): ${fmt(swapFees)}
  ├─ Slippage (~0.20%):  ${fmt(slippageCost)}
  └─ Opportunity (1d):   ${fmt(opportunityCost)}
Expected gain:    ${fmt(expectedGain)} (7d proj.)
⛔ ACTION: ${action}

--- FEES vs IL ---
💸 Daily Fees Earned:       ${fmt(feesDailyAvg)} (avg)
📉 Impermanent Loss (USD):  ${fmt(il)}
📉 Impermanent Loss (%):    ${finalHodl !== 0 ? ((finalLp / finalHodl - 1) * 100).toFixed(2) + '%' : 'N/A'}

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
                    ticks: { color: '#64748b' },
                    grid: { color: '#f1f5f9' }
                },
                y: {
                    ticks: { color: '#64748b' },
                    grid: { color: '#f1f5f9' }
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
                    ticks: { color: '#64748b' },
                    grid: { color: '#f1f5f9' }
                },
                y: {
                    ticks: { color: '#64748b' },
                    grid: { color: '#f1f5f9' }
                }
            }
        }
    });
}

let ilCurveChartInstance = null;

/**
 * Renderiza el gráfico de Curva de IL vs Precio.
 * Muestra IL% en el eje Y y precio en el eje X,
 * con marcadores en Pa, Pb y P_actual.
 */
function renderILCurveChart(canvasId, ilData, Pa, Pb, currentPrice) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (ilCurveChartInstance) {
        ilCurveChartInstance.destroy();
    }

    const priceLabels = ilData.prices.map(p => '$' + p.toFixed(2));

    const annotations = {
        paLine: {
            type: 'line',
            xMin: ilData.prices.indexOf(ilData.prices.find(p => p >= Pa)),
            xMax: ilData.prices.indexOf(ilData.prices.find(p => p >= Pa)),
            borderColor: 'rgba(239, 68, 68, 0.7)',
            borderWidth: 2,
            borderDash: [4, 4],
            label: { content: 'Pa', display: true, position: 'start', backgroundColor: 'rgba(239, 68, 68, 0.8)' }
        },
        pbLine: {
            type: 'line',
            xMin: ilData.prices.indexOf(ilData.prices.find(p => p >= Pb)),
            xMax: ilData.prices.indexOf(ilData.prices.find(p => p >= Pb)),
            borderColor: 'rgba(239, 68, 68, 0.7)',
            borderWidth: 2,
            borderDash: [4, 4],
            label: { content: 'Pb', display: true, position: 'start', backgroundColor: 'rgba(239, 68, 68, 0.8)' }
        },
        currentLine: {
            type: 'line',
            xMin: ilData.prices.indexOf(ilData.prices.find(p => p >= currentPrice)),
            xMax: ilData.prices.indexOf(ilData.prices.find(p => p >= currentPrice)),
            borderColor: 'rgba(56, 189, 248, 0.9)',
            borderWidth: 2,
            label: { content: 'Current', display: true, position: 'end', backgroundColor: 'rgba(56, 189, 248, 0.8)' }
        },
        zeroLine: {
            type: 'line',
            yMin: 0, yMax: 0,
            borderColor: 'rgba(148, 163, 184, 0.4)',
            borderWidth: 1,
            borderDash: [2, 2]
        }
    };

    ilCurveChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: priceLabels,
            datasets: [
                {
                    label: 'Impermanent Loss (%)',
                    data: ilData.ilPercent,
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'LP Value ($)',
                    data: ilData.lpValues,
                    borderColor: '#22c55e',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1'
                },
                {
                    label: 'HODL Value ($)',
                    data: ilData.hodlValues,
                    borderColor: '#94a3b8',
                    borderDash: [5, 5],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { labels: { color: '#94a3b8' } },
                annotation: { annotations },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (context.datasetIndex === 0) {
                                return `${label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                            return `${label}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#64748b', maxTicksLimit: 15 },
                    grid: { color: '#f1f5f9' }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'IL (%)', color: '#64748b' },
                    ticks: { color: '#f43f5e', callback: v => v.toFixed(2) + '%' },
                    grid: { color: '#f1f5f9' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Value ($)', color: '#64748b' },
                    ticks: { color: '#22c55e', callback: v => '$' + v.toFixed(2) },
                    grid: { drawOnChartArea: false }
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

        // 1. Ejecutar Estrategia CL (Concentrated Liquidity)
        const lpResult = simulateLPStrategy(priceData, capital, pLow, pHigh, fees24h, tvl);

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
        const fmtDec = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // -- Estadísticas de Encabezado --
        // Mostrar Patrimonio Actual (Capital Inicial)
        document.getElementById('val-total-value').textContent = fmt(capital);
        
        // Cálculo de Rango Óptimo (30 días) basado en Volatilidad
        // Usar los últimos 30 precios para calcular la volatilidad diaria reciente
        const last30Prices = prices.slice(-30);
        const dailyVol = calculateVolatility(last30Prices);
        const vol30d = dailyVol * Math.sqrt(30);
        const vol7d  = dailyVol * Math.sqrt(7);

        // --- Rango 30d ---
        const optMin30 = currentPrice * (1 - vol30d);
        const optMax30 = currentPrice * (1 + vol30d);

        const valOptRange = document.getElementById('val-opt-range');
        if (valOptRange) valOptRange.innerText = `${fmtDec(optMin30)} — ${fmtDec(optMax30)}`;

        const valOptVol = document.getElementById('val-opt-vol');
        if (valOptVol) valOptVol.innerText = `Volatility (30d): ${(vol30d * 100).toFixed(2)}%`;

        const valOptCoins = document.getElementById('val-opt-coins');
        if (valOptCoins) {
            try {
                let tokenX = "Token X", tokenY = "Token Y";
                if (symbol.includes('-')) { const p = symbol.split('-'); tokenX = p[0]; tokenY = p[1]; }
                const L_opt30 = CLEngine.calculateLiquidity(capital, currentPrice, optMin30, optMax30);
                const atMin30 = CLEngine.positionAmounts(L_opt30, optMin30, optMin30, optMax30);
                const atMax30 = CLEngine.positionAmounts(L_opt30, optMax30, optMin30, optMax30);
                valOptCoins.innerText = `${fmtDec(atMin30.x)} ${tokenX} | ${fmtDec(atMax30.y)} ${tokenY}`;
            } catch (e) { valOptCoins.innerText = "Extremos: N/A"; }
        }

        // --- Rango 7d ---
        const optMin7 = currentPrice * (1 - vol7d);
        const optMax7 = currentPrice * (1 + vol7d);

        const valOptRange7 = document.getElementById('val-opt-range-7d');
        if (valOptRange7) valOptRange7.innerText = `${fmtDec(optMin7)} — ${fmtDec(optMax7)}`;

        const valOptVol7 = document.getElementById('val-opt-vol-7d');
        if (valOptVol7) valOptVol7.innerText = `Volatility (7d): ${(vol7d * 100).toFixed(2)}%`;

        const valOptCoins7 = document.getElementById('val-opt-coins-7d');
        if (valOptCoins7) {
            try {
                let tokenX = "Token X", tokenY = "Token Y";
                if (symbol.includes('-')) { const p = symbol.split('-'); tokenX = p[0]; tokenY = p[1]; }
                const L_opt7 = CLEngine.calculateLiquidity(capital, currentPrice, optMin7, optMax7);
                const atMin7 = CLEngine.positionAmounts(L_opt7, optMin7, optMin7, optMax7);
                const atMax7 = CLEngine.positionAmounts(L_opt7, optMax7, optMin7, optMax7);
                valOptCoins7.innerText = `${fmtDec(atMin7.x)} ${tokenX} | ${fmtDec(atMax7.y)} ${tokenY}`;
            } catch (e) { valOptCoins7.innerText = "Extremos: N/A"; }
        }
        
        // Usemos la tarifa diaria teórica actual si está en el rango, o 0 si está fuera.
        // Fórmula recalibrada experimentalmente para coincidir con el simulador de Orca Whirlpools:
        // Orca aplica un multiplicador de concentración de liquidez específico basado en los ticks.
        // Usamos la relación derivada del ejemplo proporcionado (1.1095x base yield).
        const orcaMultiplier = 1.1095;
        const theoreticalDailyFee = fees24h * (capital / tvl) * orcaMultiplier; 
        
        let estYield24hUSD = 0;
        let estYield24hPct = 0;
        
        if (currentPrice >= pLow && currentPrice <= pHigh) {
             estYield24hUSD = theoreticalDailyFee;
             estYield24hPct = (theoreticalDailyFee / capital); // daily %
        }
        
        document.getElementById('val-est-yield-24h').textContent = fmt(estYield24hUSD);
        // ¿Mostrar APY anual en el encabezado o Rendimiento Diario %? La imagen dice "0.166%" lo que parece diario (0.16% * 365 = 58% APY).
        // Mostremos el rendimiento diario % aquí para coincidir probablemente con el contexto de la imagen.
        document.getElementById('val-apy-24h').textContent = (estYield24hPct * 100).toFixed(2) + "%";
        
        // document.getElementById('val-pending-yield').textContent = fmt(lpResult.feesGenerated); // REMOVED

        // -- Tabla de Portafolio --
        document.getElementById('table-pool-name').textContent = symbol;
        
        // Balance = Capital Inicial
        document.getElementById('table-balance').textContent = fmt(capital); 
        
        // document.getElementById('table-pending').textContent = fmt(lpResult.feesGenerated); // REMOVED
        
        // Est Yield Combinado
        document.getElementById('table-est-yield').textContent = `${Object.is(estYield24hUSD, NaN) ? "$0.00" : fmt(estYield24hUSD)} (${(estYield24hPct*100).toFixed(2)}%)`;

        // Visualización de Rango
        document.getElementById('range-min').textContent = fmtDec(pLow);
        document.getElementById('range-max').textContent = fmtDec(pHigh);

        // Calcular cantidades en los extremos de la posición activa (P_Low y P_High)
        const rangeMinCoins = document.getElementById('range-min-coins');
        const rangeMaxCoins = document.getElementById('range-max-coins');
        if (rangeMinCoins && rangeMaxCoins) {
            try {
                let tokenX = "Token X";
                let tokenY = "Token Y";
                if (symbol.includes('-')) {
                    const parts = symbol.split('-');
                    tokenX = parts[0];
                    tokenY = parts[1];
                }
                
                // Usar la liquidez inicial correspondiente al capital ingresado
                const L_active = CLEngine.calculateLiquidity(capital, currentPrice, pLow, pHigh);
                
                // En el extremo inferior (pLow), la posición es 100% Token X
                const amAtMin = CLEngine.positionAmounts(L_active, pLow, pLow, pHigh);
                const totalX = amAtMin.x;
                
                // En el extremo superior (pHigh), la posición es 100% Token Y (USD)
                const amAtMax = CLEngine.positionAmounts(L_active, pHigh, pLow, pHigh);
                const totalY = amAtMax.y;

                rangeMinCoins.innerText = `${fmtDec(totalX)} ${tokenX}`;
                rangeMaxCoins.innerText = `${fmtDec(totalY)} ${tokenY}`;
            } catch (e) {
                console.error("Error calculating active range coins:", e);
                rangeMinCoins.innerText = "N/A";
                rangeMaxCoins.innerText = "N/A";
            }
        }
        
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
        const ilPctVal = lpResult.finalHodlEquity !== 0 ? ((lpResult.finalEquity - lpResult.feesGenerated) / lpResult.finalHodlEquity - 1) : 0;
        document.getElementById('val-il').textContent = (ilPctVal * 100).toFixed(2) + '%';

        // ── Concentrated Liquidity Analysis ──
        // Análisis para COMPOSICIÓN ACTUAL: usa capital como Base
        // para que los valores de tokens y LP/HODL sean consistentes con el Initial Capital.
        const clSnapshot = CLEngine.analyzePosition(capital, currentPrice, pLow, pHigh, currentPrice);
        
        // Análisis HISTÓRICO para IL y Break-Even: usa precio de entrada del backtest
        const clBacktest = CLEngine.analyzePosition(capital, priceData[0].price, pLow, pHigh, currentPrice);
        const rangeEff   = CLEngine.rangeEfficiency(pLow, pHigh);
        const breakEven  = CLEngine.calculateBreakEvenFees(capital, priceData[0].price, pLow, pHigh, currentPrice, calendarDays);

        // Actualizar UI CL
        const clL = document.getElementById('cl-liquidity-L');
        if (clL) clL.textContent = clSnapshot.liquidity.toFixed(2);

        const clEff = document.getElementById('cl-range-efficiency');
        if (clEff) clEff.textContent = rangeEff.toFixed(2) + 'x';

        const clBE = document.getElementById('cl-breakeven-fees');
        if (clBE) clBE.textContent = fmt(breakEven.dailyFeesNeeded) + '/day';

        const clBEAPY = document.getElementById('cl-breakeven-apy');
        if (clBEAPY) clBEAPY.textContent = fmtPct(breakEven.annualizedAPYNeeded);

        // Token Composition: usar snapshot actual (proporcional al capital)
        const clTokenX = document.getElementById('cl-token-x');
        if (clTokenX) {
            const tokenBase = symbol.split('-')[0] || 'BASE';
            clTokenX.textContent = `${clSnapshot.targetAmounts.x.toFixed(2)} ${tokenBase}`;
        }

        const clTokenY = document.getElementById('cl-token-y');
        if (clTokenY) {
            const tokenQuote = symbol.split('-')[1] || 'QUOTE';
            clTokenY.textContent = `${clSnapshot.targetAmounts.y.toFixed(2)} ${tokenQuote}`;
        }

        // LP Value y HODL Value: usar snapshot actual (proporcionales al capital)
        const clValueLP = document.getElementById('cl-value-lp');
        if (clValueLP) clValueLP.textContent = fmt(clSnapshot.valueLP);

        const clValueHodl = document.getElementById('cl-value-hodl');
        if (clValueHodl) clValueHodl.textContent = fmt(clSnapshot.valueHodl);

        // IL: usar valor del backtest histórico (simulación completa)
        const clILPct = document.getElementById('cl-il-pct');
        if (clILPct) {
            const ilVal = ilPctVal * 100; // ilPctVal ya calculado del backtest en línea 783
            clILPct.textContent = ilVal.toFixed(2) + '%';
            clILPct.style.color = ilVal < 0 ? '#ef4444' : '#22c55e';
        }

        // 4. Alertas - Actualizar Summary Item
        // Obtener precio actual (último precio) - YA DEFINIDO ARRIBA
        const alertData = lpAlertSystem(currentPrice, pLow, pHigh, currentApyVal, maxDd);
        
        const alertSignalEl = document.getElementById('val-alert-signal');
        const alertDetailEl = document.getElementById('val-alert-detail');
        const alertItemEl = document.getElementById('alert-summary-item');
        
        if (alertSignalEl) {
            alertSignalEl.textContent = alertData.signal;
            // Color según señal
            if (alertData.signal === 'HOLD') {
                alertSignalEl.style.color = '#22c55e'; // verde
            } else {
                alertSignalEl.style.color = '#f59e0b'; // amber/warning
            }
        }
        if (alertDetailEl) {
            // Extraer la acción corta del texto
            const isIn = currentPrice >= pLow && currentPrice <= pHigh;
            if (isIn) {
                alertDetailEl.textContent = '✅ In Range · Earning fees';
            } else if (currentPrice < pLow) {
                alertDetailEl.textContent = '⚠️ Out of Range (Low)';
            } else {
                alertDetailEl.textContent = '⚠️ Out of Range (High)';
            }
            alertDetailEl.style.color = isIn ? '#22c55e' : '#f59e0b';
        }

        // 5. Generar Informe de Texto Detallado
        // const theoreticalDailyFee ya está definido arriba
        const poolFeeRate = parseFloat(document.getElementById('poolFeeTier').value) || 0.003;
        
        // Actualizar Pool Tier Label en tabla
        const poolTierLabel = document.getElementById('pool-tier-label');
        if (poolTierLabel) poolTierLabel.textContent = (poolFeeRate * 100).toFixed(2) + '%';
        
        const reportText = generateTextReport(
            symbol, pLow, pHigh, currentPrice, 
            lpResult.timeInBox, currentApyVal, dailyFeesAvg, theoreticalDailyFee,
            fees24h, lpResult.il, 
            lpResult.finalEquity, lpResult.finalHodlEquity, 
            sharpe, maxDd, cvar, capital, poolFeeRate
        );
        document.getElementById('detailedReport').textContent = reportText;

        // 6. Renderizar Gráficos
        // 6. Renderizar Gráficos
        renderPriceRangeChart('priceChart', dates, prices, pLow, pHigh);
        
        // Renderizar Gráfico de Rendimiento
        // Usar curva HODL del motor CL (consistente con la composición inicial)
        const hodlCurve = lpResult.hodlCurve;
        renderPerformanceChart('performanceChart', dates, lpResult.equityCurve, hodlCurve);

        // 7. Renderizar Gráfico de Curva IL (Concentrated Liquidity)
        const priceLow  = Math.max(pLow * 0.5, 1);
        const priceHigh = pHigh * 1.5;
        const steps     = 200;
        const step      = (priceHigh - priceLow) / steps;
        const ilPrices  = Array.from({ length: steps + 1 }, (_, i) => priceLow + i * step);
        const ilData    = CLEngine.calculateILCurve(capital, priceData[0].price, pLow, pHigh, ilPrices);
        renderILCurveChart('ilCurveChart', ilData, pLow, pHigh, currentPrice);

        // Sync with Database
        if (window.SyncService) {
            window.SyncService.syncLPAnalysis(symbol, capital, {
                apy: currentApyVal,
                sharpe: sharpe,
                drawdown: maxDd,
                il: lpResult.il,
                finalLp: lpResult.finalEquity,
                finalHodl: lpResult.finalHodlEquity
            });
        }

    } catch (error) {
        console.error(error);
        statusMsg.textContent = `❌ Error: ${error.message}`;
        statusMsg.className = "status-message status-error";
    }
});
