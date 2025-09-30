const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.API_KEY;

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