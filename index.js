import { getCandles } from "./data/candles.js";
import { runBacktest } from "./backtest/backtest.js";

const SYMBOL = "BTCUSDT";

const c5 = await getCandles(SYMBOL, "5m");
const c15 = await getCandles(SYMBOL, "15m");
const c1h = await getCandles(SYMBOL, "1h");

const { summary } = await runBacktest(c5, c15, c1h);
console.table(summary);
