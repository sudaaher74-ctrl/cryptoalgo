import { calculateRSI } from "../indicators/rsi.js";

function findSwings(candles) {
  const lows = [];
  const highs = [];

  for (let i = 2; i < candles.length - 2; i++) {
    if (
      candles[i].low < candles[i - 1].low &&
      candles[i].low < candles[i - 2].low &&
      candles[i].low < candles[i + 1].low &&
      candles[i].low < candles[i + 2].low
    ) lows.push(candles[i].low);

    if (
      candles[i].high > candles[i - 1].high &&
      candles[i].high > candles[i - 2].high &&
      candles[i].high > candles[i + 1].high &&
      candles[i].high > candles[i + 2].high
    ) highs.push(candles[i].high);
  }

  return { lows, highs };
}

export function swingBreakSell(c5, c15, c1h) {
  if (calculateRSI(c1h.map(c => c.close)) > 50) return null;
  if (calculateRSI(c5.map(c => c.close)) >= 40) return null;

  const { lows, highs } = findSwings(c15);
  if (lows.length < 2 || highs.length < 1) return null;

  const support = Math.min(lows.at(-1), lows.at(-2));
  const last = c5.at(-1);
  if (last.close >= support) return null;

  const entry = last.close;
  const stopLoss = highs.at(-1);
  const risk = stopLoss - entry;
  if (risk <= 0) return null;

  return {
    entry,
    stopLoss,
    target1: entry - risk,
    target2: entry - risk * 3
  };
}
