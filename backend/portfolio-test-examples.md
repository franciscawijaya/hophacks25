# Portfolio API Testing Examples

## Prerequisites
1. Start your backend server: `npm start` (from the backend directory)
2. Register a test user first (if you don't have one)

## Test User Registration
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "sampleuser1", "password": "testpass123"}'
```

## Test User Login (get JWT token)
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "sampleuser1", "password": "testpass123"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Portfolio API Examples

### 1. Check Initial Balance
```bash
curl -X GET http://localhost:3000/api/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "balance": 500
}
```

### 2. Buy Bitcoin (0.2 BTC at $50,000)
```bash


```

**Expected Response:**
```json
{
  "message": "Position added successfully"
}
```

### 3. Buy Ethereum (1 ETH at $3,000)
```bash
curl -X POST http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "ETHUSD",
    "quantity": 1,
    "price": 3000
  }'
```

### 4. Add More Bitcoin (0.1 BTC at $55,000)
```bash
curl -X POST http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "quantity": 0.1,
    "price": 55000
  }'
```

**Expected Response:**
```json
{
  "message": "Position updated successfully"
}
```

**Note:** The `price_per_unit_bought` will remain $50,000 (the original purchase price), but the quantity will increase to 0.3.

### 5. Check Portfolio
```bash
curl -X GET http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "portfolio": [
    {
      "symbol": "BTCUSD",
      "quantity": 0.3,
      "price_per_unit_bought": 50000
    },
    {
      "symbol": "ETHUSD",
      "quantity": 1,
      "price_per_unit_bought": 3000
    }
  ]
}
```

### 6. Check Balance After Purchases
```bash
curl -X GET http://localhost:3000/api/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "balance": 400
}
```

### 7. Sell Some Bitcoin (0.1 BTC at $60,000)
```bash
curl -X POST http://localhost:3000/api/portfolio/sell \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "quantity": 0.1,
    "price": 60000
  }'
```

**Expected Response:**
```json
{
  "message": "Position sold successfully"
}
```

### 8. Check Portfolio After Sale
```bash
curl -X GET http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "portfolio": [
    {
      "symbol": "BTCUSD",
      "quantity": 0.2,
      "price_bought": 51666.67
    },
    {
      "symbol": "ETHUSD",
      "quantity": 1,
      "price_per_unit_bought": 3000
    }
  ]
}
```

### 9. Get Balance with Portfolio Data
```bash
curl -X GET "http://localhost:3000/api/balance?includePortfolio=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "balance": 460,
  "portfolio": [
    {
      "symbol": "BTCUSD",
      "quantity": 0.2,
      "price_bought": 51666.67
    },
    {
      "symbol": "ETHUSD",
      "quantity": 1,
      "price_per_unit_bought": 3000
    }
  ]
}
```

### 10. Delete Ethereum Position
```bash
curl -X DELETE http://localhost:3000/api/portfolio/ETHUSD \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "message": "Position deleted successfully"
}
```

## Error Testing Examples

### Insufficient Balance
```bash
curl -X POST http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "quantity": 100,
    "price": 50000
  }'
```

**Expected Response:**
```json
{
  "error": "Insufficient balance"
}
```

### Selling More Than Owned
```bash
curl -X POST http://localhost:3000/api/portfolio/sell \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "quantity": 10,
    "price": 50000
  }'
```

**Expected Response:**
```json
{
  "error": "Insufficient quantity to sell"
}
```

### Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD"
  }'
```

**Expected Response:**
```json
{
  "error": "Symbol, quantity, and price are required"
}
```

## Database Verification

You can also check the database directly using SQLite:

```bash
# Navigate to backend directory
cd backend

# Open SQLite database
sqlite3 user.db

# View users table
SELECT * FROM users;

# View portfolio table
SELECT * FROM portfolio;

# View portfolio with user info
SELECT u.username, p.symbol, p.quantity, p.price_per_unit_bought 
FROM users u 
JOIN portfolio p ON u.id = p.user_id;
```

## Notes

- **Price Tracking**: The system tracks the original purchase price per unit (`price_per_unit_bought`) for each position. When you add more of the same cryptocurrency, the quantity increases but the `price_per_unit_bought` remains the same as the first purchase.
- **Balance Management**: The system automatically deducts the cost when buying and adds proceeds when selling
- **Position Cleanup**: If you sell all of a position, it's automatically removed from the portfolio
- **JWT Token**: Replace `YOUR_JWT_TOKEN_HERE` with the actual token from the login response
- **Port**: Make sure your backend is running on port 3000 (adjust if different)
