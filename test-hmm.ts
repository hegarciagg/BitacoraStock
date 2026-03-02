import { fetchAndComputeFeatures } from "./server/services/hmmFeatureService.js";
import { evaluateVoting } from "./server/services/hmmStrategyService.js";

async function run() {
  console.log("Fetching BTC-USD features...");
  const data = await fetchAndComputeFeatures("BTC-USD");
  console.log(`Fetched ${data.candles.length} candles`);
  
  let scores = new Array(9).fill(0);
  for (let i = 0; i < data.candles.length; i++) {
    const v = evaluateVoting(i, data.candles[i].close, data.indicators);
    scores[v.score]++;
  }
  
  console.log("Voting Score Distribution:");
  for(let i = 0; i <= 8; i++) {
    console.log(`Score ${i}: ${scores[i]} candles`);
  }
}
run();
