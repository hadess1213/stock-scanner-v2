exports.handler = async () => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        clientIdExists: !!process.env.TOSS_CLIENT_ID,
        secretExists: !!process.env.TOSS_CLIENT_SECRET
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e.message
      })
    };
  }
};
