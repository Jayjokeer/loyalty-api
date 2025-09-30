const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth');
const idempotencyMiddleware = require('../middleware/indempotency');
const pointsService = require('../services/points.service');
const customerService = require('../services/customer.services');
const store = require('../storage/memory.store');
const { ERRORS, CURRENCY } = require('../config/constants');


router.post('/earn', authMiddleware, idempotencyMiddleware, (req, res) => {
  const { customerId, amountMinor, currency } = req.body;

  if (!customerId || amountMinor === undefined || amountMinor === null || !currency) {
    return res.status(400).json({ 
      error: ERRORS.INVALID_REQUEST, 
      message: 'customerId, amountMinor, and currency are required' 
    });
  }

  if (currency !== CURRENCY) {
    return res.status(400).json({ 
      error: ERRORS.INVALID_CURRENCY, 
      message: `Only ${CURRENCY} currency is supported` 
    });
  }

  if (!customerService.customerExists(customerId)) {
    return res.status(404).json({ 
      error: ERRORS.CUSTOMER_NOT_FOUND, 
      message: 'Customer does not exist' 
    });
  }

  try {
    const result = pointsService.earnPoints(customerId, amountMinor);
    
    store.storeIdempotentResponse(req.idempotencyFullKey, 200, result);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error earning points:', error);
    return res.status(500).json({ 
      error: ERRORS.INTERNAL_ERROR, 
      message: 'An error occurred while earning points' 
    });
  }
});


router.post('/redeem', authMiddleware, idempotencyMiddleware, (req, res) => {
  const { customerId, points } = req.body;

  if (!customerId || points === undefined || points === null) {
    return res.status(400).json({ 
      error: ERRORS.INVALID_REQUEST, 
      message: 'customerId and points are required' 
    });
  }

  if (!customerService.customerExists(customerId)) {
    return res.status(404).json({ 
      error: ERRORS.CUSTOMER_NOT_FOUND, 
      message: 'Customer does not exist' 
    });
  }

  try {
    const result = pointsService.redeemPoints(customerId, points);
    
    if (!result.success) {
      const errorResponse = {
        error: result.error,
        message: result.message
      };
      store.storeIdempotentResponse(req.idempotencyFullKey, 400, errorResponse);
      return res.status(400).json(errorResponse);
    }

    const response = {
      customerId: result.customerId,
      redeemedPoints: result.redeemedPoints,
      newBalance: result.newBalance
    };

    store.storeIdempotentResponse(req.idempotencyFullKey, 200, response);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error redeeming points:', error);
    return res.status(500).json({ 
      error: ERRORS.INTERNAL_ERROR, 
      message: 'An error occurred while redeeming points' 
    });
  }
});

module.exports = router;