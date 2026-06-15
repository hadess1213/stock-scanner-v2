// functions/scan.js

exports.handler = async function(event, context) {
    const clientId = process.env.TOSS_CLIENT_ID;
    const clientSecret = process.env.TOSS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return sendErrorToUI("Netlify 환경변수에 TOSS_CLIENT_ID 또는 TOSS_CLIENT_SECRET이 누락되었습니다.");
    }

    try {
        // [1단계] 토스증권 공식 규격에 맞춰 암호화 키 생성 (Basic Auth)
        const authKey = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // [2단계] Netlify 내장 fetch 기능을 사용하여 토스 토큰 발급 요청
        let tokenResponse;
        try {
            tokenResponse = await fetch('https://openapi.tossinvest.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials'
                })
            });
        } catch (err) {
            throw new Error(`토스 인증서버망 접속 실패: ${err.message}`);
        }

        // 키가 틀렸을 때 처리
        if (!tokenResponse.ok) {
            const errStatusCode = tokenResponse.status;
            if (errStatusCode === 401) {
                throw new Error("토스 API 인증 실패 (401): Netlify에 입력한 Client ID / Secret 값이 정확한지 다시 확인해주세요.");
            } else {
                throw new Error(`토스 서버 거절 (코드 ${errStatusCode})`);
            }
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // [3단계] 발급받은 입장권으로 실시간 거래대금 상위 종목 요청
        let marketResponse;
        try {
            marketResponse = await fetch('https://openapi.tossinvest.com/v1/market/ranking?type=volume', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });
        } catch (err) {
            throw new Error(`주가 시세 데이터 요청 실패: ${err.message}`);
        }

        // 만약 주소가 점검 중이거나 살짝 다를 경우 처리
        if (!marketResponse.ok) {
            throw new Error(`시세조회 실패: 상태코드 ${marketResponse.status} (API 세부 주소 확인 필요)`);
        }

        const realData = await marketResponse.json();

        // [4단계] 최종 성공 데이터 리턴
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: [
                    { name: "✅ 진짜 데이터 연결 성공!", score: 100 },
                    { name: "토스증권 연결이", score: 99 },
                    { name: "완벽히 뚫렸습니다.", score: 98 }
                ],
                ai: {
                    target: "연결 완료",
                    decision: "분석 가동",
                    confidence: 100,
                    reasons: ["토스 Open API 공식 인증 망 연동에 성공했습니다!"]
                }
            })
        };

    } catch (error) {
        // 부품 에러가 아니면 이제 여기서 안전하게 예외를 붙잡아 화면에 한글로 띄워줍니다.
        return sendErrorToUI(error.message);
    }
};

function sendErrorToUI(errorMessage) {
    return {
        statusCode: 200, 
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
            success: true,
            top10: [
                { name: "❌ 토스 API 연결 상태 체크", score: 0 },
                { name: "하단 AI 매수 판단 칸의", score: 0 },
                { name: "문구를 확인해주세요.", score: 0 }
            ],
            ai: {
                target: "확인 필요",
                decision: "보안 점검",
                confidence: 0,
                reasons: [errorMessage]
            }
        })
    };
}
