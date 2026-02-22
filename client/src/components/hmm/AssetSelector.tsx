/**
 * AssetSelector.tsx
 * Grouped dropdown of the 16 supported assets, matching the stock/config.js catalog.
 * Emits the selected symbol string via onChange.
 */

interface Asset {
  symbol: string;
  name:   string;
}

interface AssetGroup {
  label:  string;
  emoji:  string;
  assets: readonly Asset[];
}

const GROUPS: AssetGroup[] = [
  {
    label: "Digital Assets",
    emoji: "₿",
    assets: [
      { symbol: "BTC-USD", name: "Bitcoin" },
      { symbol: "ETH-USD", name: "Ethereum" },
      { symbol: "SOL-USD", name: "Solana" },
      { symbol: "ADA-USD", name: "Cardano" },
      { symbol: "XRP-USD", name: "XRP" },
    ],
  },
  {
    label: "ETFs",
    emoji: "📊",
    assets: [
      { symbol: "VOO",  name: "Vanguard S&P 500 ETF" },
      { symbol: "SCHH", name: "Schwab US REIT ETF" },
      { symbol: "ARTY", name: "Arty ETF" },
      { symbol: "AU",   name: "AngloGold Ashanti" },
    ],
  },
  {
    label: "Stocks",
    emoji: "📈",
    assets: [
      { symbol: "MSFT",  name: "Microsoft" },
      { symbol: "GOOGL", name: "Alphabet (Google)" },
      { symbol: "QCOM",  name: "Qualcomm" },
      { symbol: "TSM",   name: "TSMC" },
      { symbol: "MARA",  name: "Marathon Digital" },
      { symbol: "EC",    name: "Ecopetrol" },
    ],
  },
];

interface AssetSelectorProps {
  value:    string;
  onChange: (symbol: string) => void;
  disabled?: boolean;
}

export default function AssetSelector({ value, onChange, disabled = false }: AssetSelectorProps) {
  // Find the label for the currently selected asset
  const currentAsset = GROUPS
    .flatMap(g => g.assets)
    .find(a => a.symbol === value);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <label className="text-xs text-slate-400 whitespace-nowrap font-medium">Activo:</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`
          bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2
          focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500
          disabled:opacity-40 disabled:cursor-not-allowed
          min-w-[220px]
        `}
      >
        {GROUPS.map(group => (
          <optgroup
            key={group.label}
            label={`${group.emoji} ${group.label}`}
            className="bg-slate-800 text-slate-300"
          >
            {group.assets.map(asset => (
              <option
                key={asset.symbol}
                value={asset.symbol}
                className="bg-slate-800 text-white"
              >
                {asset.symbol} — {asset.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {currentAsset && (
        <span className="text-xs text-slate-500 ml-1">
          {currentAsset.name}
        </span>
      )}
    </div>
  );
}
