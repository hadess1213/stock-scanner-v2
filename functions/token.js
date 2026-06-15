exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "토큰 함수 연결 성공"
    })
  };
};
