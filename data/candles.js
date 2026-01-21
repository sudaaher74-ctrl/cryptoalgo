import axios from "axios";

export async function getCandles(symbol, interval, limit = 300) {
  const res = await axios.get(
    "https://api.binance.com/api/v3/klines",
    { params: { symbol, interval, limit } }
  );

  return res.data.map(c => ({
    openTime: c[0],
    open: +c[1],
    high: +c[2],
    low: +c[3],
    close: +c[4]
  }));
}
