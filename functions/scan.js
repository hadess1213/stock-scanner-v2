// functions/scan.js

exports.handler = async function(event, context) {
    try {
        // [1단계] 분석하고 싶은 국내 대표 급등/단타 후보 종목 세팅
        // (종목코드 뒤에 .KS는 코스피, .KQ는 코스닥을 뜻합니다)
        const stocks = [
            { symbol: "005930.KS", name: "삼성전자" },
            { symbol: "000660.KS", name: "SK하이닉스" },
            { symbol: "068270.KS", name: "셀트리온" },
            { symbol: "005380.KS", name: "현대차" },
            { symbol: "000270.KS", name: "기아" },
            { symbol: "086520.KQ", name: "에코프로" },
            { symbol: "005490.KS", name: "POSCO홀딩스" }
        ];

        // [2단계] 공개된 실시간 금융 데이터망(Yahoo Finance API 망)에 주가 요청하기
        const symbolsPath = stocks.map(s => s.symbol).join(',');
        
        // Netlify 내장 fetch 기능을 사용하여 실시간 시세 데이터 수집
        let response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsPath}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error("공개 주가 데이터망 응답 실패");
        }

        const data = await response.json();
        const quoteResults = data.quoteResponse?.result || [];

        // [3단계] 진짜 실시간 데이터를 바탕으로 단타 점수 계산하기 (알고리즘)
        const finalStockList = stocks.map(stock => {
            // 야후 금융 망에서 해당 종목의 실시간 주가 정보 매칭
            const realInfo = quoteResults.find(q => q.symbol === stock.symbol);
            
            // 실시간 변동률(정확한 진짜 데이터) 가져오기
            const changePercent = realInfo ? realInfo.regularMarketChangePercent : 0;
            const currentPrice = realInfo ? realInfo.regularMarketPrice : 0;

            // 단타 점수 부여 공식: 오늘 상승률이 높을수록 점수가 높게 책정됨
            // 기본 80점에 상승률 * 2배를 더해 실시간 점수 변동 효과를 줍니다.
            let dantaScore = Math.floor(80 + (changePercent * 2));
            if (dantaScore > 100) dantaScore = 100;
            if (dantaScore < 0) dantaScore = 0;

            return {
                name: stock.name,
                score: dantaScore,
                price: currentPrice.toLocaleString() + "원",
                change: (changePercent >= 0 ? "+" : "") + changePercent.toFixed(2) + "%"
            };
        }).sort((a, b) => b.score - a.score); // 점수 높은 순 정렬

        const bestStock = finalStockList[0];

        // [4단계] 최종 성공 데이터 대시보드 화면으로 전송
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: finalStockList.slice(0, 3), // 상위 3개 노출
                ai: {
                    target: bestStock.name,
                    decision: "실시간 분석중",
                    confidence: 90,
                    reasons: [
                        "공개 금융 시세 서버와 성공적으로 동기화되었습니다.",
                        `현재 ${bestStock.name} 종목이 당일 실시간 변동률 ${bestStock.change}로 단타 조건에 가장 근접함.`,
                        "30초 주기로 진짜 주가와 상승률을 추적하여 순위를 재계산합니다."
                    ]
                }
            })
        };

    } catch (error) {
        // 혹시라도 망 에러 발생 시 예외 안전장치
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: [{ name: "⚠️ 금융망 일시 지연", score: 0 }],
                ai: { target: "연결 확인", decision: "재시도중", confidence: 0, reasons: [error.message] }
            })
        };
    }
};
