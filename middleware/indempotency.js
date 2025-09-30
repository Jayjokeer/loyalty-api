const crypto = require('crypto');
const store = require('../storage/memory.store');
const { ERRORS } = require('../config/constants');


function createIdempotencyHash(method, path, body, key) {
  const bodyHash = crypto.createHash('sha256')
    .update(JSON.stringify(body))
    .digest('hex');
  return `${method}:${path}:${bodyHash}:${key}`;
}


function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (!idempotencyKey) {
    return res.status(400).json({ 
      error: ERRORS.MISSING_IDEMPOTENCY_KEY, 
      message: 'Idempotency-Key header is required' 
    });
  }

  const fullKey = createIdempotencyHash(
    req.method, 
    req.path, 
    req.body, 
    idempotencyKey
  );
  
  if (store.hasIdempotentResponse(fullKey)) {
    const stored = store.getIdempotentResponse(fullKey);
    return res.status(stored.status).json(stored.response);
  }

  req.idempotencyFullKey = fullKey;
  next();
}

module.exports = idempotencyMiddleware;