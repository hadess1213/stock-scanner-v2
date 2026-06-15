// functions/scan.js
const fetch = require('node-fetch'); // Netlify 환경에서 안정적인 통신을 위해 추가

exports.handler = async function(event, context) {
    const clientId = process.env.TOSS_CLIENT_ID;
    const clientSecret = process.env.TOSS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return sendErrorToUI("Netlify 환경변수에 TOSS_CLIENT_ID 또는 TOSS_CLIENT_SECRET이 없습니다.");
    }

    try {
        // [1단계] 토스증권 토큰 발급 요청 (안전한 에러 처리를 위해 블록 분리)
        let tokenResponse;
        try {
            tokenResponse = await fetch('https://openapi.tossinvest.com/v1/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret
                })
            });
        } catch (err) {
            throw new Error(`토스 서버 접속 실패: ${err.message}`);
        }

        if (!tokenResponse.ok) {
            const errText = await tokenResponse.text();
            throw new Error(`토스 인증 실패 (코드가 401 등이면 ID/Secret 입력 오류): ${tokenResponse.status} - ${errText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // [2단계] 토스증권 진짜 주가 데이터 요청
        // ※ 토스증권의 실제 실시간 순위/시세 API 엔드포인트 주소 표준에 맞춤
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
            throw new Error(`토스 주가 데이터 요청 실패: ${err.message}`);
        }

        if (!marketResponse.ok) {
            throw new Error(`토스 데이터 요청 거절: 상태코드 ${marketResponse.status}`);
        }

        const realData = await marketResponse.json();

        // [3단계] 연결 성공 시 결과 리턴
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: [
                    { name: "✅ 진짜 데이터 연결 성공!", score: 100 },
                    { name: "데이터를 정상적으로", score: 99 },
                    { name: "받아오고 있습니다.", score: 98 }
