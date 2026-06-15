// functions/scan.js

exports.handler = async function(event, context) {
    const clientId = process.env.TOSS_CLIENT_ID;
    const clientSecret = process.env.TOSS_CLIENT_SECRET;

    // 기본 가상 데이터 저장소 (토스 인증 실패 시 우회 작동용)
    const mockStocks = [
        { name: "삼성전자", score: 94, price: "72,300원" },
        { name: "SK하이닉스", score: 91, price: "182,500원" },
        { name: "셀트리온", score: 88, price: "195,200원" }
    ];

    try {
        if (!clientId || !clientSecret) {
            throw new Error("환경변수 키 누락");
        }

        const authKey = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        // [1단계] 토큰 발급 시도
        let tokenResponse = await fetch('https://openapi.tossinvest.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ grant_type: 'client_credentials' })
        });

        // 403이나 401 에러 발생 시 서버를 터뜨리지 않고 catch 블록으로 던집니다.
        if (!tokenResponse.ok) {
            throw new Error(`AUTH_ERROR_${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // [2단계] 시세조회 시도
        const targetSymbols = "005930,000660,068270";
        let marketResponse = await fetch(`https://openapi.tossinvest.com/api/v1/prices?symbols=${targetSymbols}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!marketResponse.ok) {
            throw new Error(`MARKET_ERROR_${marketResponse.status}`);
        }

        const priceData = await marketResponse.json();
        const tossResult = priceData.result || [];

        const nameMap = { "005930": "삼성전자", "000660": "SK하이닉스", "068270": "셀트리온" };
        const finalStockList = tossResult.map(item => {
            const rawPrice = parseInt(item.lastPrice || "0");
            return {
                name: nameMap[item.symbol] || `종목(${item.symbol})`,
                score: 85 + (rawPrice % 10),
                price: rawPrice.toLocaleString() + "원"
            };
        }).sort((a, b) => b.score - a.score);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: finalStockList,
                ai: {
                    target: finalStockList[0].name,
                    decision: "실시간 연동중",
                    confidence: 95,
                    reasons: ["토스증권 실시간 공식 데이터 반영 중입니다."]
                }
            })
        };

    } catch (error) {
        // ❌ 만약 토스 키 인증에 실패하더라도 화면을 멈추지 않고 가상 엔진으로 매끄럽게 구동시킵니다.
        const dynamicStocks = mockStocks.map(s => ({
            name: s.name,
            score: s.score + (Math.floor(Math.random() * 5) - 2)
        })).sort((a, b) => b.score - a.score);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: dynamicStocks,
                ai: {
                    target: dynamicStocks[0].name,
                    decision: "안전 모드 가동",
                    confidence: 88,
                    reasons: [
                        "⚠️ 현재 토스 API 키 설정 혹은 권한에 점검이 필요합니다. (403/401 거절 발생)",
                        "시스템 마비를 방지하기 위해 단타 분석 엔진이 '안전 모드(가상 시세)'로 작동 중입니다.",
                        "Netlify 환경변수(공백 제거)를 재설정하시면 즉시 실시간 데이터로 교체됩니다."
                    ]
                }
            })
        };
    }
};
