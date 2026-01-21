import { createObjectCsvWriter } from "csv-writer";

function writer(path) {
  return createObjectCsvWriter({
    path,
    header: [
      { id: "entryTime", title: "ENTRY_TIME" },
      { id: "exitTime", title: "EXIT_TIME" },
      { id: "entry", title: "ENTRY" },
      { id: "sl", title: "STOP_LOSS" },
      { id: "tp1", title: "TP1" },
      { id: "tp2", title: "TP2" },
      { id: "result", title: "RESULT" },
      { id: "pnl", title: "PNL_R" }
    ],
    append: true
  });
}

const writers = {
  backtest: writer("reports/backtest_trades.csv"),
  live: writer("reports/live_trades.csv")
};

export async function logTrades(trades, mode) {
  if (!trades.length) return;
  await writers[mode].writeRecords(trades);
}
