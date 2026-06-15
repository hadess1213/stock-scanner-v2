const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // 1. CORS 설정 (GitHub Pages에서의 호출 허용)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    try {
        // 예시로 금융 사이트 URL (수집하려는 타겟 URL로 변경하세요)
        const targetUrl = 'https://finance.naver.com/sise/sise_quant.naver'; 
        
        const { data } = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);
        const results = [];

        // 여기에 실제 데이터를 긁어오는 로직 (예시: 종목명 추출)
        $('.tltle').each((i, el) => {
            results.push($(el).text().trim());
        });

        // 2. 결과 반환
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        // 3. 에러 발생 시 처리
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
