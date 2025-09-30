const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth');
const customerService = require('../services/customer.services');
const { ERRORS } = require('../config/constants');


router.post('/', authMiddleware,  (req, res) => {
  const { phone, email } = req.body;

  if (!phone) {
    return res.status(400).json({ 
      error: ERRORS.INVALID_REQUEST, 
      message: 'Phone is required' 
    });
  }

  try {
    const existing = customerService.getCustomer(phone);
    if (existing) {
      return res.status(200).json(existing);
    }

    const customer = customerService.createOrGetCustomer(phone, email);
    return res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ 
      error: ERRORS.INTERNAL_ERROR, 
      message: 'An error occurred while creating customer' 
    });
  }
});

module.exports = router;