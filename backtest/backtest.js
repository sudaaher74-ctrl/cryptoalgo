import { swingBreakSell } from "../strategy/swingBreakSell.js";
import { logTrades } from "../reports/tradeLogger.js";
import fs from "fs";

export async function runBacktest(c5, c15, c1h) {
  let equity = 0, peak = 0, maxDD = 0;
  let wins = 0, losses = 0;
  const trades = [];
  const equityCurve = [];

  for (let i = 100; i < c5.length; i++) {
    const s5 = c5.slice(0, i);
    const s15 = c15.filter(c => c.openTime <= s5.at(-1).openTime);
    const s1h = c1h.filter(c => c.openTime <= s5.at(-1).openTime);

    const setup = swingBreakSell(s5, s15, s1h);
    if (!setup) continue;

    const entryTime = new Date(s5.at(-1).openTime).toISOString();
    const { entry, stopLoss: sl, target1: tp1, target2: tp2 } = setup;
    let partial = false;

    for (let j = i; j < c5.length; j++) {
      const c = c5[j];
      let pnl = 0, result = "";

      if (c.high >= sl) {
        pnl = partial ? -0.5 : -1;
        result = "LOSS";
        losses++;
      }

      if (!partial && c.low <= tp1) {
        partial = true;
        equity += 0.5;
      }

      if (c.low <= tp2) {
        pnl = 1.5;
        result = "WIN";
        wins++;
      }

      if (result) {
        equity += pnl;
        peak = Math.max(peak, equity);
        maxDD = Math.min(maxDD, equity - peak);

        equityCurve.push({ time: entryTime, equity });
        trades.push({
          entryTime,
          exitTime: new Date(c.openTime).toISOString(),
          entry, sl, tp1, tp2, result, pnl
        });
        break;
      }
    }
  }

  await logTrades(trades, "backtest");

  fs.writeFileSync(
    "reports/equity.csv",
    "TIME,EQUITY_R\n" +
    equityCurve.map(e => `${e.time},${e.equity}`).join("\n")
  );

  return {
    summary: {
      trades: trades.length,
      wins,
      losses,
      winRate: ((wins / trades.length) * 100 || 0).toFixed(2) + "%",
      netPnL: equity.toFixed(2) + "R",
      maxDrawdown: maxDD.toFixed(2) + "R"
    },
    trades
  };
}
