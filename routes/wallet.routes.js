const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth');
const walletService = require('../services/wallet.service');
const customerService = require('../services/customer.services');
const { ERRORS } = require('../config/constants');

router.get('/:customerId', authMiddleware, (req, res) => {
  const { customerId } = req.params;

  if (!customerService.customerExists(customerId)) {
    return res.status(404).json({ 
      error: ERRORS.CUSTOMER_NOT_FOUND, 
      message: 'Customer does not exist' 
    });
  }

  try {
    const wallet = walletService.getWalletSummary(customerId);
    return res.status(200).json(wallet);
  } catch (error) {
    console.error('Error getting wallet:', error);
    return res.status(500).json({ 
      error: ERRORS.INTERNAL_ERROR, 
      message: 'An error occurred while retrieving wallet' 
    });
  }
});

module.exports = router;