import WebSocket from "ws";
import { getCandles } from "../data/candles.js";
import { swingBreakSell } from "../strategy/swingBreakSell.js";
import { logTrades } from "../reports/tradeLogger.js";
import { sendTelegram } from "../services/telegram.js";

// ===============================
// STATE
// ===============================
let openTrade = null;
let dailyPnL = 0;
let currentDay = new Date().toISOString().slice(0, 10);

const MAX_DAILY_LOSS = -3; // -3R per day

// ===============================
// DAILY RESET
// ===============================
function resetDayIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDay) {
    currentDay = today;
    dailyPnL = 0;
    console.log("🔄 New Day → Daily PnL Reset");
  }
}

// ===============================
// START WS PAPER TRADING
// ===============================
export function startWsPaperTrading(symbol) {
  console.log("🟢 LIVE WEBSOCKET PAPER TRADING STARTED");
  console.log("Symbol:", symbol);
  console.log("Max Daily Loss:", MAX_DAILY_LOSS + "R\n");

  const ws = new WebSocket(
    `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_5m`
  );

  ws.on("open", () => {
    console.log("✅ WebSocket Connected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket Error:", err.message);
  });

  ws.on("message", async (data) => {
    try {
      resetDayIfNeeded();

      // Stop trading if daily loss hit
      if (dailyPnL <= MAX_DAILY_LOSS) {
        console.log("⛔ DAILY LOSS LIMIT HIT → TRADING STOPPED");
        return;
      }

      const msg = JSON.parse(data);
      const kline = msg.k;

      // Only act on candle CLOSE
      if (!kline.x) return;

      const closeTime = new Date(kline.t).toISOString();
      console.log("🕯️ Candle Closed:", closeTime);

      // Fetch candles
      const c5 = await getCandles(symbol, "5m", 300);
      const c15 = await getCandles(symbol, "15m", 300);
      const c1h = await getCandles(symbol, "1h", 300);

      // ===============================
      // ENTRY
      // ===============================
      if (!openTrade) {
        const setup = swingBreakSell(c5, c15, c1h);
        if (!setup) return;

        openTrade = {
          entryTime: closeTime,
          entry: setup.entry,
          sl: setup.stopLoss,
          tp1: setup.target1,
          tp2: setup.target2,
          partial: false
        };

        console.table(openTrade);

        await sendTelegram(
          `🚨 SELL ENTRY (${symbol})
Entry: ${openTrade.entry}
SL: ${openTrade.sl}
TP1: ${openTrade.tp1}
TP2: ${openTrade.tp2}
RR: 1:3`
        );

        return;
      }

      // ===============================
      // TRADE MANAGEMENT
      // ===============================
      const last = c5.at(-1);

      // ---- STOP LOSS ----
      if (last.high >= openTrade.sl) {
        const loss = openTrade.partial ? -0.5 : -1;
        dailyPnL += loss;

        await logTrades([{
          entryTime: openTrade.entryTime,
          exitTime: closeTime,
          entry: openTrade.entry,
          sl: openTrade.sl,
          tp1: openTrade.tp1,
          tp2: openTrade.tp2,
          result: "LOSS",
          pnl: loss
        }], "live");

        await sendTelegram(
          `❌ STOP LOSS HIT (${symbol})
PNL: ${loss}R`
        );

        openTrade = null;
        return;
      }

      // ---- TP1 ----
      if (!openTrade.partial && last.low <= openTrade.tp1) {
        openTrade.partial = true;
        openTrade.sl = openTrade.entry;
        dailyPnL += 0.5;

        await sendTelegram(
          `✅ TP1 HIT (${symbol})
SL moved to Breakeven`
        );
      }

      // ---- TP2 ----
      if (last.low <= openTrade.tp2) {
        dailyPnL += 1.5;

        await logTrades([{
          entryTime: openTrade.entryTime,
          exitTime: closeTime,
          entry: openTrade.entry,
          sl: openTrade.sl,
          tp1: openTrade.tp1,
          tp2: openTrade.tp2,
          result: "WIN",
          pnl: 1.5
        }], "live");

        await sendTelegram(
          `🎯 TP2 HIT (${symbol})
PNL: +1.5R`
        );

        openTrade = null;
      }

    } catch (err) {
      console.error("Runtime Error:", err.message);
    }
  });
}
