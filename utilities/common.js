function getCurrentDate() {
  const now = new Date();
  const lagosDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return lagosDate.toISOString().split('T')[0];
}


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

function getCustomerBalance(customerId) {
  let earned = 0;
  let redeemed = 0;

  for (const tx of transactions.values()) {
    if (tx.customerId === customerId) {
      earned += tx.points;
    }
  }

  for (const redemption of redemptions.values()) {
    if (redemption.customerId === customerId) {
      redeemed += redemption.points;
    }
  }

  return earned - redeemed;
}

function getLifetimeStats(customerId) {
  let earned = 0;
  let redeemed = 0;

  for (const tx of transactions.values()) {
    if (tx.customerId === customerId) {
      earned += tx.points;
    }
  }

  for (const redemption of redemptions.values()) {
    if (redemption.customerId === customerId) {
      redeemed += redemption.points;
    }
  }

  return { earned, redeemed };
}

module.exports = {
    getLifetimeStats,
    getCustomerBalance,
    getDailyEarnedPoints,
    getIdempotencyKey,
    generateId,
    getCurrentDate
}