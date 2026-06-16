// api/token.js
let cachedToken = null;
let tokenExpireAt = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpireAt) return cachedToken;

  const key    = process.env.TOSS_API_KEY;
  const secret = process.env.TOSS_API_SECRET;

  if (!key || !secret) throw new Error("환경변수 TOSS_API_KEY / TOSS_API_SECRET 미설정");

  // 방법 1: body에 client_id, client_secret 넣는 방식 (POST body)
  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     key,
    client_secret: secret,
  });

  const res = await fetch("https://openapi.tossinvest.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();

  if (!res.ok) {
    // 방법 1 실패 시 방법 2: Basic 인증 헤더 방식으로 재시도
    const basic = Buffer.from(`${key}:${secret}`).toString("base64");
    const res2 = await fetch("https://openapi.tossinvest.com/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const text2 = await res2.text();

    if (!res2.ok) {
      throw new Error(`토큰 발급 실패\n방법1(body): ${text}\n방법2(Basic): ${text2}`);
    }

    const data2 = JSON.parse(text2);
    cachedToken   = data2.access_token;
    tokenExpireAt = now + ((data2.expires_in || 3600) - 300) * 1000;
    return cachedToken;
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
    res.status(200).json({ success: true, message: "토큰 발급 성공!" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

module.exports.getToken = getToken;
