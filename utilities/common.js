const crypto = require("crypto");


function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function getIdempotencyKey(method, path, body, key) {
  const bodyHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return `${method}:${path}:${bodyHash}:${key}`;
}



module.exports = {
    getIdempotencyKey,
    generateId,
}