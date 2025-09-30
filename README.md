# Loyalty Lite API

A lightweight Node.js monolith for a merchant loyalty points system with idempotent operations and daily caps.

## Features

- ✅ Customer management (create with phone deduplication)
- ✅ Earn points (1 point per ₦100 spent)
- ✅ Redeem points with balance validation
- ✅ Wallet summary with lifetime stats
- ✅ Daily earning cap (5,000 points/day with clipping)
- ✅ Idempotency for write operations
- ✅ API key authentication
- ✅ Africa/Lagos timezone support
- ✅ In-memory storage

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Server
```bash
npm start
# or for development
npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

All endpoints require header: `X-API-Key: test_key`

### 1. Create Customer
**POST** `/customers`

Creates a customer or returns existing one if phone already exists.

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -d '{
    "phone": "2347030000000",
    "email": "ada@example.com"
  }'
```

**Response:**
```json
{
  "id": "cust_123abc...",
  "phone": "2347030000000",
  "email": "ada@example.com",
  "createdAt": "2025-09-29T12:34:56.000Z"
}
```

### 2. Earn Points
**POST** `/earn`

Awards points based on spending. Requires `Idempotency-Key` header.

**Rate:** 1 point per ₦100 (100 kobo)  
**Daily Cap:** 5,000 points (clips excess, doesn't reject)

```bash
curl -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: req-001" \
  -d '{
    "customerId": "cust_123abc...",
    "amountMinor": 120000,
    "currency": "NGN"
  }'
```

**Request Body:**
- `customerId`: Customer ID
- `amountMinor`: Amount in kobo (minor units)
- `currency`: Must be "NGN"

**Response:**
```json
{
  "customerId": "cust_123abc...",
  "creditedPoints": 1200,
  "remainingDailyAllowance": 3800,
  "transaction": {
    "id": "tx_001xyz...",
    "customerId": "cust_123abc...",
    "amountMinor": 120000,
    "points": 1200,
    "createdAt": "2025-09-29T12:35:12.000Z"
  }
}
```

### 3. Redeem Points
**POST** `/redeem`

Deducts points from customer balance. Requires `Idempotency-Key` header.

```bash
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: req-002" \
  -d '{
    "customerId": "cust_123abc...",
    "points": 500
  }'
```

**Success Response:**
```json
{
  "customerId": "cust_123abc...",
  "redeemedPoints": 500,
  "newBalance": 700
}
```

**Insufficient Points Response (400):**
```json
{
  "error": "INSUFFICIENT_POINTS",
  "message": "Not enough points to redeem."
}
```

### 4. Wallet Summary
**GET** `/wallet/:customerId`

Retrieves customer's point balance and statistics.

```bash
curl -X GET http://localhost:3000/wallet/cust_123abc... \
  -H "X-API-Key: test_key"
```

**Response:**
```json
{
  "customerId": "cust_123abc...",
  "balancePoints": 8700,
  "todayEarnedPoints": 1200,
  "lifetimeEarnedPoints": 15200,
  "lifetimeRedeemedPoints": 6500
}
```

## Complete Example Flow

```bash
# 1. Create a customer
CUSTOMER=$(curl -s -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -d '{"phone":"2347030000000","email":"ada@example.com"}')

CUSTOMER_ID=$(echo $CUSTOMER | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created customer: $CUSTOMER_ID"

# 2. Earn points (₦1,200 = 1200 points)
curl -s -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: earn-001" \
  -d "{\"customerId\":\"$CUSTOMER_ID\",\"amountMinor\":120000,\"currency\":\"NGN\"}"

# 3. Check wallet
curl -s -X GET http://localhost:3000/wallet/$CUSTOMER_ID \
  -H "X-API-Key: test_key"

# 4. Redeem 500 points
curl -s -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: redeem-001" \
  -d "{\"customerId\":\"$CUSTOMER_ID\",\"points\":500}"

# 5. Check wallet again
curl -s -X GET http://localhost:3000/wallet/$CUSTOMER_ID \
  -H "X-API-Key: test_key"
```

## Business Rules

### Points Calculation
- **Rate:** 1 point per ₦100 spent
- **Formula:** `points = Math.floor(amountMinor / 100)`
- **Example:** ₦1,200 (120,000 kobo) = 1,200 points

### Daily Cap
- **Limit:** 5,000 points per calendar day (Africa/Lagos timezone)
- **Behavior:** Clips excess points to remaining allowance
- **Example:** If 4,800 points earned today and customer earns 500 more, only 200 are credited

### Idempotency
- **Required for:** POST /earn, POST /redeem
- **Mechanism:** Same `method + path + body + Idempotency-Key` returns identical response
- **Conflict:** Different body with same key returns 409 (not implemented in basic version)

### Currency
- **Supported:** NGN only
- **Unit:** kobo (minor units, 1/100 of Naira)

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad request (invalid payload, missing idempotency key, insufficient points) |
| 401 | Unauthorized (missing or invalid API key) |
| 404 | Customer not found |
| 409 | Idempotency conflict (same key, different body) |
| 500 | Internal server error |

## Testing Idempotency

```bash
# Same request twice should return identical response
curl -s -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: test-idem-001" \
  -d '{"customerId":"cust_xyz","amountMinor":50000,"currency":"NGN"}'

# Replay - should get same response, no double-credit
curl -s -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: test-idem-001" \
  -d '{"customerId":"cust_xyz","amountMinor":50000,"currency":"NGN"}'
```

## Testing Daily Cap

```bash
# Earn 4,800 points
curl -s -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: cap-001" \
  -d '{"customerId":"cust_xyz","amountMinor":480000,"currency":"NGN"}'

# Try to earn 500 more (should clip to 200)
curl -s -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: cap-002" \
  -d '{"customerId":"cust_xyz","amountMinor":50000,"currency":"NGN"}'
# Response: creditedPoints: 200, remainingDailyAllowance: 0
```

## Architecture

- **Framework:** Express.js
- **Storage:** In-memory (Map objects)
- **Auth:** API key in header
- **Timezone:** Africa/Lagos for daily cap calculation
- **Idempotency:** SHA-256 hash of method+path+body+key

## Limitations

- In-memory storage (data lost on restart)
- Single process (no horizontal scaling)
- No persistence layer
- Basic error handling

## Future Enhancements (Bonus)

- [ ] SQLite persistence
- [ ] Unit tests
- [ ] Docker support
- [ ] Rate limiting
- [ ] Logging middleware
- [ ] Admin endpoints
- [ ] Point expiration
- [ ] Transaction history endpoint

## License

MIT