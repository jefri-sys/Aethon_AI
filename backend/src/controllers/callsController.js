exports.getTurnCredentials = (req, res) => {
  res.json({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: process.env.METERED_TURN_URL, username: process.env.METERED_USERNAME, credential: process.env.METERED_CREDENTIAL },
      { urls: "turn:relay.metered.ca:443", username: process.env.METERED_USERNAME, credential: process.env.METERED_CREDENTIAL }
    ]
  });
};
