// api/token.js
// 토스증권 액세스 토큰 발급 (Vercel 서버 함수)

let cachedToken = null;
let tokenExpireAt = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpireAt) return cachedToken;

  const key    = process.env.TOSS_API_KEY;
  const secret = process.env.TOSS_API_SECRET;

  if (!key || !secret) throw new Error("환경변수 미설정: TOSS_API_KEY 또는 TOSS_API_SECRET 없음");

  // Basic 인증: "API키:시크릿키" base64 인코딩
  const basic = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch("https://openapi.tossinvest.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const text = await res.text();

  if (!res.ok) {
    // 디버그: 키 앞 10자리만 로그 (보안상 전체 노출 안 함)
    const keyPreview    = key    ? key.substring(0, 10)    + "..." : "없음";
    const secretPreview = secret ? secret.substring(0, 10) + "..." : "없음";
    throw new Error(`토큰 발급 실패 (${res.status}) | API키 앞부분: ${keyPreview} | Secret 앞부분: ${secretPreview} | 응답: ${text}`);
  }

  const data = JSON.parse(text);
  cachedToken   = data.access_token;
  tokenExpireAt = now + ((data.expires_in || 3600) - 300) * 1000;
  return cachedToken;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const token = await getToken();
    res.status(200).json({ success: true, token: token.substring(0, 20) + "..." });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

module.exports.getToken = getToken;
