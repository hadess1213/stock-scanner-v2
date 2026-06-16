export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const response = await fetch('https://finance.naver.com/sise/sise_quant.naver');
    const data = await response.text();
    
    // 데이터를 정상적으로 가져오는지 확인용
    res.status(200).json({ 
      success: true, 
      message: "데이터가 수신되었습니다.",
      htmlLength: data.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
