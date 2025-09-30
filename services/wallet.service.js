const store = require('../storage/memory.store');
const { getCurrentDate, toTimezoneDate } = require('../utilities/dates.utils');


function getDailyEarnedPoints(customerId, date) {
  const transactions = store.getCustomerTransactions(customerId);
  let total = 0;

  for (const tx of transactions) {
    console.log(tx)
    const txDate = toTimezoneDate(tx.createdAt);
    if (txDate === date) {
      total += tx.points;
    }
  }

  return total;
}
function getCustomerBalance(customerId) {
  const transactions = store.getCustomerTransactions(customerId);
  const redemptions = store.getCustomerRedemptions(customerId);

  let earned = 0;
  let redeemed = 0;

  for (const tx of transactions) {
    earned += tx.points;
  }

  for (const redemption of redemptions) {
    redeemed += redemption.points;
  }

  return earned - redeemed;
}

function getLifetimeStats(customerId) {
  const transactions = store.getCustomerTransactions(customerId);
  const redemptions = store.getCustomerRedemptions(customerId);

  let earned = 0;
  let redeemed = 0;

  for (const tx of transactions) {
    earned += tx.points;
  }

  for (const redemption of redemptions) {
    redeemed += redemption.points;
  }

  return { earned, redeemed };
}

function getWalletSummary(customerId) {
  const today = getCurrentDate();
  console.log(getDailyEarnedPoints(customerId, today))
  const todayEarned = getDailyEarnedPoints(customerId, today);
  const balance = getCustomerBalance(customerId);
  const lifetime = getLifetimeStats(customerId);

  return {
    customerId,
    balancePoints: balance,
    todayEarnedPoints: todayEarned,
    lifetimeEarnedPoints: lifetime.earned,
    lifetimeRedeemedPoints: lifetime.redeemed
  };
}

module.exports = {
  getCustomerBalance,
  getLifetimeStats,
  getWalletSummary
};