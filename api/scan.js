module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // 내장 fetch 사용 (라이브러리 설치 불필요)
        const response = await fetch('https://finance.naver.com/sise/sise_quant.naver');
        const data = await response.text();

        // 단순 테스트를 위해 데이터가 잘 받아졌는지 확인만 함
        res.status(200).json({
            success: true,
            message: "데이터 수신 성공",
            length: data.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
