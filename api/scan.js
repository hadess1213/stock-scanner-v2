module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // 내장된 fetch를 사용하여 데이터를 가져옵니다. (라이브러리 불필요)
        const response = await fetch('https://finance.naver.com/sise/sise_quant.naver');
        const text = await response.text();

        // 성공 응답 반환
        res.status(200).json({
            success: true,
            data: "데이터 수신 성공! (라이브러리 없이 구현함)"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
