// api/token.js
// 토스증권 액세스 토큰 발급
// Vercel 환경변수: TOSS_API_KEY, TOSS_API_SECRET

let cachedToken = null;
let tokenExpireAt = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpireAt) return cachedToken;

  const key    = process.env.TOSS_API_KEY;
  const secret = process.env.TOSS_API_SECRET;

  if (!key || !secret) throw new Error("환경변수 TOSS_API_KEY / TOSS_API_SECRET 미설정");

  const basic = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch("https://openapi.tossinvest.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`토큰 발급 실패 (${res.status}): ${txt}`);
  }

  const data = await res.json();
  cachedToken  = data.access_token;
  tokenExpireAt = now + ((data.expires_in || 3600) - 300) * 1000;
  return cachedToken;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const token = await getToken();
    res.status(200).json({ success: true, token });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// 다른 서버함수에서 import해서 쓸 수 있도록 export
module.exports.getToken = getToken;
