const store = require('../storage/memory.store');
const { getCurrentDate } = require('../utilities/dates.utils');
const  {getDailyEarnedPoints}  = require('./points.service');

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