const crypto = require("crypto");


function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function getIdempotencyKey(method, path, body, key) {
  const bodyHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return `${method}:${path}:${bodyHash}:${key}`;
}

function getDailyEarnedPoints(customerId, date) {
  let total = 0;
  for (const tx of transactions.values()) {
    if (tx.customerId === customerId) {
      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
      if (txDate === date) {
        total += tx.points;
      }
    }
  }
  return total;
}



module.exports = {
    getDailyEarnedPoints,
    getIdempotencyKey,
    generateId,
}