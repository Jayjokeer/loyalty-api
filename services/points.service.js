const store = require('../storage/memory.store');
const { getCurrentDate, toTimezoneDate, getCurrentTimestamp } = require('../utilities/dates.utils');
const { PREFIXES, DAILY_CAP, EARN_RATE } = require('../config/constants');
const { getCustomerBalance } = require('../services/wallet.service');
const { generateId } = require('../utilities/common');


function calculatePoints(amountMinor) {
  return Math.floor(amountMinor / EARN_RATE);
}


function getDailyEarnedPoints(customerId, date) {
  const transactions = store.getCustomerTransactions(customerId);
  let total = 0;

  for (const tx of transactions) {
    const txDate = toTimezoneDate(tx.createdAt);
    if (txDate === date) {
      total += tx.points;
    }
  }

  return total;
}


function getRemainingDailyAllowance(customerId) {
  const today = getCurrentDate();
  const todayEarned = getDailyEarnedPoints(customerId, today);
  return Math.max(0, DAILY_CAP - todayEarned);
}

function earnPoints(customerId, amountMinor) {
  const calculatedPoints = calculatePoints(amountMinor);
  
  const remainingAllowance = getRemainingDailyAllowance(customerId);
  const creditedPoints = Math.min(calculatedPoints, remainingAllowance);

  const transaction = {
    id: generateId(PREFIXES.TRANSACTION),
    customerId,
    amountMinor,
    points: creditedPoints,
    createdAt: getCurrentTimestamp()
  };

  store.createTransaction(transaction);

  return {
    customerId,
    creditedPoints,
    remainingDailyAllowance: remainingAllowance - creditedPoints,
    transaction
  };
}


function redeemPoints(customerId, points) {
  
  const currentBalance = getCustomerBalance(customerId);
  
  if (currentBalance < points) {
    return {
      success: false,
      error: 'INSUFFICIENT_POINTS',
      message: 'Not enough points to redeem.'
    };
  }

  const redemption = {
    id: generateId(PREFIXES.REDEMPTION),
    customerId,
    points,
    createdAt: getCurrentTimestamp()
  };

  store.createRedemption(redemption);

  const newBalance = currentBalance - points;

  return {
    success: true,
    customerId,
    redeemedPoints: points,
    newBalance
  };
}

module.exports = {
  calculatePoints,
  getDailyEarnedPoints,
  getRemainingDailyAllowance,
  earnPoints,
  redeemPoints
};