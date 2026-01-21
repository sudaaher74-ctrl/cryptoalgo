import axios from "axios";

// 🔐 PUT YOUR REAL VALUES HERE
const BOT_TOKEN = "8411510176:AAGhkCuDbjwd75WH7yHBWvSRvvbpCk5dYXY";
const CHAT_ID = "5418857242"; // ONLY NUMBER, no text

export async function sendTelegram(message) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message
      }
    );
  } catch (err) {
    console.error("Telegram Error:", err.response?.data || err.message);
  }
}
