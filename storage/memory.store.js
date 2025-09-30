class MemoryStore {
  constructor() {
    this.customers = new Map();
    this.transactions = new Map();
    this.redemptions = new Map();
    this.idempotency = new Map();
  }

  createCustomer(customer) {
    this.customers.set(customer.id, customer);
    return customer;
  }

  getCustomerById(id) {
    return this.customers.get(id);
  }

  getCustomerByPhone(phone) {
    for (const customer of this.customers.values()) {
      if (customer.phone === phone) {
        return customer;
      }
    }
    return null;
  }

  customerExists(id) {
    return this.customers.has(id);
  }

  getAllCustomers() {
    return Array.from(this.customers.values());
  }

  createTransaction(transaction) {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  getTransactionById(id) {
    return this.transactions.get(id);
  }

  getCustomerTransactions(customerId) {
    const txs = [];
    for (const tx of this.transactions.values()) {
      if (tx.customerId === customerId) {
        txs.push(tx);
      }
    }
    return txs;
  }

  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  createRedemption(redemption) {
    this.redemptions.set(redemption.id, redemption);
    return redemption;
  }

  getRedemptionById(id) {
    return this.redemptions.get(id);
  }

  getCustomerRedemptions(customerId) {
    const redemptions = [];
    for (const redemption of this.redemptions.values()) {
      if (redemption.customerId === customerId) {
        redemptions.push(redemption);
      }
    }
    return redemptions;
  }

  getAllRedemptions() {
    return Array.from(this.redemptions.values());
  }

  getIdempotentResponse(key) {
    return this.idempotency.get(key);
  }

  storeIdempotentResponse(key, status, response) {
    this.idempotency.set(key, { status, response });
  }

  hasIdempotentResponse(key) {
    return this.idempotency.has(key);
  }

  clear() {
    this.customers.clear();
    this.transactions.clear();
    this.redemptions.clear();
    this.idempotency.clear();
  }

  getStats() {
    return {
      customers: this.customers.size,
      transactions: this.transactions.size,
      redemptions: this.redemptions.size,
      idempotencyCache: this.idempotency.size
    };
  }
}

module.exports = new MemoryStore();