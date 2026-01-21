import axios from "axios";

// 🔐 PUT YOUR REAL VALUES HERE
const BOT_TOKEN = "";
const CHAT_ID = ""; // ONLY NUMBER, no text

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
