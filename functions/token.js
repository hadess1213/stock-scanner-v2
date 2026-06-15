exports.handler = async () => {
  try {
    const response = await fetch(
      "https://api.tossinvest.com/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.TOSS_CLIENT_ID,
          client_secret: process.env.TOSS_CLIENT_SECRET
        })
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
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
