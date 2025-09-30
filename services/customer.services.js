const store = require('../storage/memory.store');
const { generateId } = require('../utilities/common');
const { getCurrentTimestamp } = require('../utilities/dates.utils');
const { PREFIXES } = require('../config/constants');


function createOrGetCustomer(phone, email) {
  const existing = store.getCustomerByPhone(phone);
  if (existing) {
    return existing;
  }

  const customer = {
    id: generateId(PREFIXES.CUSTOMER),
    phone,
    email: email || null,
    createdAt: getCurrentTimestamp()
  };

  return store.createCustomer(customer);
}


function getCustomer(customerId) {
  return store.getCustomerById(customerId);
}


function customerExists(customerId) {
  return store.customerExists(customerId);
}

module.exports = {
  createOrGetCustomer,
  getCustomer,
  customerExists
};