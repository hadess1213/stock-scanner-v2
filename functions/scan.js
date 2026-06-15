// functions/scan.js
exports.handler = async function(event, context) {
    // 1. Netlify에 저장한 토스 API 키 가져오기
    const clientId = process.env.TOSS_CLIENT_ID;
    const clientSecret = process.env.TOSS_CLIENT_SECRET;

    // 만약 환경변수 설정이 안 되어 있다면 화면에 에러 표시
    if (!clientId || !clientSecret) {
        return sendErrorToUI("Netlify 환경변수에 TOSS API 키가 없습니다. 설정을 확인해주세요.");
    }

    try {
        // ====================================================================
        // [1단계] 토스증권 서버에 API 키를 보내서 '입장권(Token)' 발급받기
        // ====================================================================
        const tokenResponse = await fetch('https://openapi.tossinvest.com/v1/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!tokenResponse.ok) {
            throw new Error("토스 API 키 인증 실패 (키를 잘못 입력했거나, 토스 측 승인 대기중일 수 있습니다.)");
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // ====================================================================
        // [2단계] 입장권을 사용해 진짜 '주식 데이터' 가져오기 (예: 거래대금 상위)
        // (주의: 아래 주소는 토스 API 문서에 따라 약간 수정해야 할 수 있습니다.)
        // ====================================================================
        const marketResponse = await fetch('https://openapi.tossinvest.com/v1/market/ranking?type=volume', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!marketResponse.ok) {
            throw new Error("주식 데이터를 불러올 수 없습니다. API 주소나 권한을 확인해주세요.");
        }

        const realData = await marketResponse.json();

        // ====================================================================
        // [3단계] 받아온 진짜 데이터로 '단타 스캔' 조건 분석하기
        // ====================================================================
        
        // 데이터가 정상적으로 들어왔다면, 여기서부터 급등주/눌림목 필터링 로직이 들어갑니다.
        // 현재는 실전 데이터를 연결하는 테스트 단계이므로, 데이터 연동 성공 메시지를 띄웁니다.
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: true,
                top10: [
                    { name: "✅ 진짜 데이터 연결 성공!", score: 100 },
                    { name: "이제 토스 API 문서를 보고", score: 99 },
                    { name: "원하는 종목을 세팅하면 됩니다", score: 98 }
                ],
                ai: {
                    target: "API 연결 완벽함",
                    decision: "분석 시스템 가동 준비 완료",
                    confidence: 100,
                    reasons: [
                        "토스증권 서버와 정상적으로 통신 성공",
                        "인증 토큰(Token) 발급 정상 확인",
                        "이제 검색 조건 수식만 짜넣으면 완성입니다!"
                    ]
                }
            })
        };

    } catch (error) {
        // 에러가 발생하면 화면(프론트엔드)에 에러 원인을 띄워줍니다.
        return sendErrorToUI(error.message);
    }
};

// 화면에 에러를 안전하게 전달해주는 헬퍼 함수
function sendErrorToUI(errorMessage) {
    return {
        statusCode: 200, 
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
            success: true,
