// api/scan.js
const { getToken } = require("./token");

const BASE = "https://openapi.tossinvest.com";

// 토스 시세 API 엔드포인트 후보 (정확한 URL 탐색)
async function fetchPrice(code, token) {
  const endpoints = [
    `${BASE}/v1/market/price?stockCode=${code}`,
    `${BASE}/api/v1/market/price?stockCode=${code}`,
    `${BASE}/v1/market/price?symbol=${code}`,
    `${BASE}/api/v1/market/price?symbol=${code}`,
    `${BASE}/v1/stocks/${code}/price`,
    `${BASE}/api/v1/stocks/${code}/price`,
    `${BASE}/v1/price?stockCode=${code}`,
  ];

  const headers = { "Authorization": `Bearer ${token}` };
  const results = [];

  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers });
      const text = await r.text();
      if (r.ok) {
        return { ok: true, url, data: JSON.parse(text) };
      }
      results.push(`${r.status}: ${url.replace(BASE, "")} → ${text.slice(0, 80)}`);
    } catch(e) {
      results.push(`ERR: ${url.replace(BASE, "")} → ${e.message}`);
    }
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
      return res.status(200).json({
        success: true,
        workingUrl: result.url.replace(BASE, ""),
        data: result.data
      });
    }

    return res.status(404).json({
      success: false,
      error: "모든 엔드포인트 실패",
      tried: result.tried
    });

  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
