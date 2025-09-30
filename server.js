const express = require('express');
const crypto = require('crypto');
const {authMiddleware} = require("./middleware/auth");
const {  
    getLifetimeStats,
    getCustomerBalance,
    getDailyEarnedPoints,
    getIdempotencyKey,
    generateId,
    getCurrentDate 
} = require("./utilities/common");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = 'test_key';
const TIMEZONE = 'Africa/Lagos';
const DAILY_CAP = 5000;
const POINTS_PER_NAIRA = 1; 

const customers = new Map();
const transactions = new Map();
const redemptions = new Map();
const idempotencyStore = new Map();


function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (!idempotencyKey) {
    return res.status(400).json({ 
      error: 'MISSING_IDEMPOTENCY_KEY', 
      message: 'Idempotency-Key header is required' 
    });
  }

  const fullKey = getIdempotencyKey(req.method, req.path, req.body, idempotencyKey);
  
  if (idempotencyStore.has(fullKey)) {
    const stored = idempotencyStore.get(fullKey);
    return res.status(stored.status).json(stored.response);
  }

  req.idempotencyFullKey = fullKey;
  next();
}

function storeIdempotentResponse(key, status, response) {
  idempotencyStore.set(key, { status, response });
}



// 1) Create customer
app.post('/customers', authMiddleware, (req, res) => {
  const { phone, email } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Phone is required' });
  }

  // Check if customer already exists
  for (const customer of customers.values()) {
    if (customer.phone === phone) {
      return res.status(200).json(customer);
    }
  }

  // Create new customer
  const customer = {
    id: generateId('cust'),
    phone,
    email: email || null,
    createdAt: new Date().toISOString()
  };

  customers.set(customer.id, customer);
  return res.status(201).json(customer);
});

// 2) Earn points
app.post('/earn', authMiddleware, idempotencyMiddleware, (req, res) => {
  const { customerId, amountMinor, currency } = req.body;

  // Validate request
  if (!customerId || !amountMinor || !currency) {
    return res.status(400).json({ 
      error: 'INVALID_REQUEST', 
      message: 'customerId, amountMinor, and currency are required' 
    });
  }

  if (currency !== 'NGN') {
    return res.status(400).json({ 
      error: 'INVALID_CURRENCY', 
      message: 'Only NGN currency is supported' 
    });
  }

  // Check if customer exists
  if (!customers.has(customerId)) {
    return res.status(404).json({ 
      error: 'CUSTOMER_NOT_FOUND', 
      message: 'Customer does not exist' 
    });
  }

  // Calculate points
  const calculatedPoints = Math.floor(amountMinor / 100);
  
  // Check daily cap
  const today = getCurrentDate();
  const todayEarned = getDailyEarnedPoints(customerId, today);
  const remainingAllowance = Math.max(0, DAILY_CAP - todayEarned);
  const creditedPoints = Math.min(calculatedPoints, remainingAllowance);

  // Create transaction
  const transaction = {
    id: generateId('tx'),
    customerId,
    amountMinor,
    points: creditedPoints,
    createdAt: new Date().toISOString()
  };

  transactions.set(transaction.id, transaction);

  const response = {
    customerId,
    creditedPoints,
    remainingDailyAllowance: remainingAllowance - creditedPoints,
    transaction
  };

  // Store for idempotency
  storeIdempotentResponse(req.idempotencyFullKey, 200, response);

  return res.status(200).json(response);
});

// 3) Redeem points
app.post('/redeem', authMiddleware, idempotencyMiddleware, (req, res) => {
  const { customerId, points } = req.body;

  // Validate request
  if (!customerId || points === undefined || points === null) {
    return res.status(400).json({ 
      error: 'INVALID_REQUEST', 
      message: 'customerId and points are required' 
    });
  }

  // Check if customer exists
  if (!customers.has(customerId)) {
    return res.status(404).json({ 
      error: 'CUSTOMER_NOT_FOUND', 
      message: 'Customer does not exist' 
    });
  }

  // Check balance
  const currentBalance = getCustomerBalance(customerId);
  
  if (currentBalance < points) {
    const response = {
      error: 'INSUFFICIENT_POINTS',
      message: 'Not enough points to redeem.'
    };
    storeIdempotentResponse(req.idempotencyFullKey, 400, response);
    return res.status(400).json(response);
  }

  // Create redemption record
  const redemption = {
    id: generateId('red'),
    customerId,
    points,
    createdAt: new Date().toISOString()
  };

  redemptions.set(redemption.id, redemption);

  const newBalance = currentBalance - points;
  const response = {
    customerId,
    redeemedPoints: points,
    newBalance
  };

  // Store for idempotency
  storeIdempotentResponse(req.idempotencyFullKey, 200, response);

  return res.status(200).json(response);
});

// 4) Wallet summary
app.get('/wallet/:customerId', authMiddleware, (req, res) => {
  const { customerId } = req.params;

  // Check if customer exists
  if (!customers.has(customerId)) {
    return res.status(404).json({ 
      error: 'CUSTOMER_NOT_FOUND', 
      message: 'Customer does not exist' 
    });
  }

  const today = getCurrentDate();
  const todayEarned = getDailyEarnedPoints(customerId, today);
  const balance = getCustomerBalance(customerId);
  const lifetime = getLifetimeStats(customerId);

  return res.status(200).json({
    customerId,
    balancePoints: balance,
    todayEarnedPoints: todayEarned,
    lifetimeEarnedPoints: lifetime.earned,
    lifetimeRedeemedPoints: lifetime.redeemed
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An internal error occurred' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Loyalty Lite API running on port ${PORT}`);
  console.log(`📍 Timezone: ${TIMEZONE}`);
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`📊 Daily cap: ${DAILY_CAP} points`);
});

module.exports = app;