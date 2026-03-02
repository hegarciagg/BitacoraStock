import { fetchAndComputeFeatures } from "./server/services/hmmFeatureService.js";
import { runBacktest } from "./server/services/hmmRiskService.js";
import { generateSignal } from "./server/services/hmmStrategyService.js";
import axios from "axios";

async function run() {
  console.log("Fetching features...");
  const data = await fetchAndComputeFeatures("BTC-USD");
  console.log(`Candles: ${data.candles.length}`);
  
  console.log("Calling Python service...");
  const pyRes = await axios.post("http://localhost:8000/detect-regimes", data.hmm);
  const hmmData = pyRes.data;
  console.log(`Hmm States: ${hmmData.states.length}, bull: ${hmmData.bullState}, bear: ${hmmData.bearState}`);
  
  const result = runBacktest(data.candles, hmmData.states, hmmData.bullState, hmmData.bearState, data.indicators);
  console.log(`Generated ${result.trades.length} trades.`);
  console.log(result.trades);
  
  let counts = new Array(7).fill(0);
  for(let s of hmmData.states) counts[s]++;
  console.log("State distribution:");
  counts.forEach((c, idx) => console.log(`State ${idx}: ${c} hours. Bull=${hmmData.bullState === idx}`));
}
run().catch(console.error);
