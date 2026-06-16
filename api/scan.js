module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Finnhub API 키를 입력하세요
    const FINNHUB_KEY = '본인의_API_키를_여기에_입력';
    const SYMBOL = 'AAPL'; // 원하는 종목 코드
    const url = `https://finnhub.io/api/v1/quote?symbol=${SYMBOL}&token=${FINNHUB_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        res.status(200).json({ 
            success: true, 
            price: data.c // 현재 가격
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
