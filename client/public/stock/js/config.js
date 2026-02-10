window.CONFIG = {
    // Assets from the reference Python script
    ASSETS: {
        CRYPTO: ['BTC-USD', 'ETH-USD', 'ADA-USD', 'SOL-USD', 'XRP-USD'],
        ETF: ['VOO', 'SCHH', 'ARTY', 'AU'], 
        STOCKS: ['MSFT', 'GOOGL', 'QCOM', 'TSM', 'MARA', 'EC']
    },
    // Excluded as per Python script: ['VNQ', 'MSTR', 'RTX', 'DOGE-USD', 'SOXX']
    
    BENCHMARK: 'VOO',
    RISK_FREE_RATE: 0.3, 
    TRADING_DAYS: 252,
    SIMULATION: {
        NUM_PORTFOLIOS: 500000, // Increased to match Python's higher fidelity call
        BATCH_SIZE: 10000
    },
    MIN_DATA_POINTS_PCT: 0.60, 
    HISTORY_YEARS: 5,
    METADATA: {
        'VOO': { name: 'Vanguard S&P 500 ETF', desc: 'Rastrea las 500 empresas más grandes de EE.UU.' },
        'SCHH': { name: 'Schwab US REIT ETF', desc: 'Fondo dedicado a bienes raíces comerciales y residenciales.' },
        'ARTY': { name: 'Arty ETF', desc: 'Fondo enfocado en activos de arte y coleccionables.' },
        'AU': { name: 'AngloGold Ashanti', desc: 'Compañía minera de oro con presencia global.' },
        'MSFT': { name: 'Microsoft Corp', desc: 'Gigante tecnológico líder en software y computación en la nube.' },
        'GOOGL': { name: 'Alphabet Inc.', desc: 'Empresa matriz de Google, líder en búsqueda y servicios digitales.' },
        'QCOM': { name: 'Qualcomm', desc: 'Líder en tecnología de semiconductores y comunicaciones inalámbricas.' },
        'TSM': { name: 'Taiwan Semiconductor', desc: 'El mayor fabricante de chips por contrato del mundo.' },
        'MARA': { name: 'Marathon Digital', desc: 'Empresa dedicada a la minería de Bitcoin a gran escala.' },
        'EC': { name: 'Ecopetrol S.A.', desc: 'La compañía petrolera y energética más importante de Colombia.' },
        'BTC-USD': { name: 'Bitcoin', desc: 'La criptomoneda original y de mayor valor de mercado.' },
        'ETH-USD': { name: 'Ethereum', desc: 'Plataforma líder para contratos inteligentes y DeFi.' },
        'ADA-USD': { name: 'Cardano', desc: 'Blockchain enfocada en seguridad y sostenibilidad académica.' },
        'SOL-USD': { name: 'Solana', desc: 'Red de alta velocidad diseñada para aplicaciones descentralizadas.' },
        'XRP-USD': { name: 'XRP', desc: 'Activo digital diseñado para pagos globales ultrarrápidos.' }
    }
};
