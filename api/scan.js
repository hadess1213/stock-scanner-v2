// api/scan.js
// 토스증권 실시간 시세 조회
// 호출: GET /api/scan?code=005930
//       GET /api/scan?code=005930,000660,035420  (복수 종목)

const { getToken } = require("./token");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // 종목코드 파싱 (쉼표로 여러 개 가능)
  const raw   = (req.query.code || "005930").trim();
  const codes = raw.split(",").map(c => c.trim()).filter(Boolean);

  if (codes.length === 0) {
    return res.status(400).json({ error: "code 파라미터가 없습니다." });
  }

  try {
    const token = await getToken();

    // 종목별로 시세 조회 (병렬)
    const results = await Promise.all(
      codes.map(async (code) => {
        const r = await fetch(
          `https://openapi.tossinvest.com/v1/market/price?stockCode=${code}`,
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (!r.ok) {
          return { code, error: `조회 실패 (${r.status})` };
        }
        const d = await r.json();
        return {
          code,
          name:         d.name        || code,
          price:        d.currentPrice ?? d.price ?? null,  // 현재가
          change:       d.changePrice  ?? null,              // 전일 대비 금액
          changeRate:   d.changeRate   ?? null,              // 전일 대비 %
          volume:       d.volume       ?? null,              // 거래량
          high:         d.highPrice    ?? null,
          low:          d.lowPrice     ?? null,
          open:         d.openPrice    ?? null,
          prevClose:    d.prevClosePrice ?? null,
          updatedAt:    new Date().toISOString(),
        };
      })
    );

    return res.status(200).json({ success: true, data: results });

  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
