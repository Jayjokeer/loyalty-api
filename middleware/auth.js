const {API_KEY} = require("../config/constants");

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or missing API key' });
  }
  next();
}

module.exports = {
    authMiddleware
}