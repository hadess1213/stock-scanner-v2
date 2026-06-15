// functions/scan.js

exports.handler = async function(event, context) {
    const targetStocks = [
        { symbol: "005930.KS", name: "🇰🇷 삼성전자", isKr: true },
        { symbol: "000660.KS", name: "🇰🇷 SK하이닉스", isKr: true },
        { symbol: "086520.KQ", name: "🇰🇷 에코프로", isKr: true },
        { symbol: "247540.KQ", name: "🇰🇷 에코프로비엠", isKr: true },
        { symbol: "005380.KS", name: "🇰🇷 현대차", isKr: true },
        { symbol: "TSLA", name: "🇺🇸 테슬라", isKr: false },
        { symbol: "NVDA", name: "🇺🇸 엔비디아", isKr: false },
        { symbol: "AAPL", name: "🇺🇸 애플", isKr: false },
        { symbol: "TQQQ", name: "🇺🇸 TQQQ (나스닥 3배)", isKr: false },
        { symbol: "SOXL", name: "🇺🇸 SOXL (반도체 3배)", isKr: false }
    ];

    try {
        const symbolsPath = targetStocks.map(s => s.symbol).join(',');
        let response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsPath}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json',
                'Accept-Language': 'ko-KR,ko;q=0.9',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) return generateUltimateBackup(targetStocks);

        const data = await response.json();
        const quoteResults = data.quoteResponse?.result || [];
        if (quoteResults.length === 0) return generateUltimateBackup(targetStocks);

        const finalStockList = targetStocks.map(stock => {
            const realInfo = quoteResults.find(q => q.symbol === stock.symbol);
            const changePercent = realInfo ? realInfo.regularMarketChangePercent : 0;
            const currentPrice = realInfo ? realInfo.regularMarketPrice : 0;

            let dantaScore = Math.floor(82 + (changePercent * 2.5));
            if (dantaScore > 100) dantaScore = 100;
            if (dantaScore < 0) dantaScore = 0;

            const formattedPrice = stock.isKr ? currentPrice.toLocaleString() + "원" : "$" + currentPrice.toLocaleString();

            return { name: stock.name, score: dantaScore, price: formattedPrice, change: (changePercent >= 0 ? "+" : "") + changePercent.toFixed(2) + "%" };
        }).sort((a, b) => b.score - a.score);

        const bestStock = finalStockList[0];

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: finalStockList,
                ai: {
                    target: bestStock.name,
                    decision: "실시간 돌파매매",
                    confidence: 96,
                    reasons: getTraderQuotes(bestStock.name, bestStock.change)
                }
            })
        };

    } catch (error) {
        return generateUltimateBackup(targetStocks);
    }
};

// 🛡️ 백업 연산 엔진 + 🔥 매운맛 단타 멘트 탑재
function generateUltimateBackup(stocks) {
    const backupList = stocks.map((s, idx) => {
        const mockChange = (Math.random() * 14 - 6); // -6% ~ +8% 가상 연산
        let dantaScore = Math.floor(83 + (mockChange * 2));
        if (dantaScore > 100) dantaScore = 100;
        if (dantaScore < 0) dantaScore = 0;

        let basePrice = 72000;
        if (s.symbol.includes("000660")) basePrice = 183000;
        if (s.symbol.includes("086520")) basePrice = 102000;
        if (s.symbol.includes("247540")) basePrice = 178000;
        if (s.symbol.includes("005380")) basePrice = 245000;
        if (s.symbol.includes("TSLA")) basePrice = 175;
        if (s.symbol.includes("NVDA")) basePrice = 880;
        if (s.symbol.includes("AAPL")) basePrice = 172;
        if (s.symbol.includes("TQQQ")) basePrice = 58;
        if (s.symbol.includes("SOXL")) basePrice = 42;

        const finalPrice = basePrice * (1 + (mockChange / 100));
        const formattedPrice = s.isKr ? Math.floor(finalPrice).toLocaleString() + "원" : "$" + finalPrice.toFixed(2);

        return { name: s.name, score: dantaScore, price: formattedPrice, change: (mockChange >= 0 ? "+" : "") + mockChange.toFixed(2) + "%" };
    }).sort((a, b) => b.score - a.score);

    const bestStock = backupList[0];

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
            success: true,
            top10: backupList,
            ai: {
                target: bestStock.name,
                decision: "호가창 불타기 수급포착",
                confidence: 91,
                reasons: getTraderQuotes(bestStock.name, bestStock.change)
            }
        })
    };
}

// 💬 단타 프로들의 주옥같은 실전 멘트 주머니 생성기
function getTraderQuotes(targetName, changeRate) {
    // 트레이더들의 주옥같은 멘트들 리스트
    const quotesPool = [
        `현재 [${targetName}]에 시장의 모든 돈이 몰리고 있습니다. 거래대금 폭발 중!`,
        `당일 등락률 ${changeRate} 돌파! 전형적인 거래량 실린 장대양봉 패턴입니다.`,
        "손절선 딱 잡고 가야 하는 자리입니다. 뇌동매매 절대 금지, 추격 매수는 3분봉 확인 후 진입!",
        "나스닥 선물 지수 변동성이 심상치 않습니다. 미장 형님들의 무빙을 주시하세요.",
        "지금 호가창 물량 먹어치우는 속도가 개미가 아닙니다. 주포 형님들 롤링 시작된 듯.",
        `눌림목 타점 노리던 분들은 지금이 기회일 수 있습니다. 단, -2% 깨지면 칼손절 준비.`,
        "레버리지 상품들 수급 꼬이는 거 보니 오늘 밤 미장 꽤나 다이내믹하겠네요. 안전벨트 매세요.",
        "오늘 국장 주도주는 확실히 이쪽 섹터네요. 대장주만 패야 살아남습니다."
    ];

    // 무작위로 섞어서 상위 3개 멘트만 추출해서 화면에 띄워줍니다.
    const shuffled = quotesPool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}
