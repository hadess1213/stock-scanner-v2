// api/scan.js
const { getToken } = require("./token");
const BASE = "https://openapi.tossinvest.com";

async function fetchPrice(code, token) {
  // 토스는 종목코드 앞에 'A' 붙이는 경우 있음 (예: A005930)
  const codeA = code.startsWith("A") ? code : `A${code}`;
  const headers = { "Authorization": `Bearer ${token}` };

  const endpoints = [
    // symbol 파라미터 + A 접두어
    `${BASE}/api/v1/market/price?symbol=${codeA}`,
    `${BASE}/api/v1/market/price?symbol=${code}`,
    // stockCode 파라미터
    `${BASE}/api/v1/market/price?stockCode=${codeA}`,
    `${BASE}/api/v1/market/price?stockCode=${code}`,
    // v1 (api/ 없는 버전)
    `${BASE}/v1/market/price?symbol=${codeA}`,
    `${BASE}/v1/market/price?symbol=${code}`,
    // stocks 경로
    `${BASE}/api/v1/stocks/${codeA}/price`,
    `${BASE}/api/v1/stocks/${code}/price`,
  ];

  const results = [];
  for (const url of endpoints) {
    const r = await fetch(url, { headers });
    const text = await r.text();
    if (r.ok) return { ok: true, url: url.replace(BASE,""), data: JSON.parse(text) };
    results.push(`${r.status}: ${url.replace(BASE,"")} → ${text.slice(0,100)}`);
  }
  return { ok: false, tried: results };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const code = (req.query.code || "005930").trim();
  try {
    const token = await getToken();
    const result = await fetchPrice(code, token);
    if (result.ok) {
      return res.status(200).json({ success: true, workingUrl: result.url, data: result.data });
    }
    return res.status(404).json({ success: false, error: "모든 엔드포인트 실패", tried: result.tried });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
