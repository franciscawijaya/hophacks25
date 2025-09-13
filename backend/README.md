# Trading Simulator Backend API Design

This backend is designed for a trading simulator, supporting user registration, login, balance inquiry, trading, and more. The API follows **RESTful** principles and returns **JSON** responses. The backend server listens on port `3000`.

## User Endpoints

- **Register**
  - `POST /api/register`
  - Request: `{ username, password }`
  - Response
    - 201 Success `{ message: 'User registered successfully' }`
    - 400 Missing Parameter `{ error: 'Username and password required' }`
    - 409 Duplicate Username `{ error: 'Username already exists' }`
    - 500 Server Error `{ error: 'Database error' | 'Server error'}`
  
- **Login**
  - `POST /api/login`
  - Request: `{ username, password }`
  - Response: JWT token or error
    - 200 Success `{ token }`
    - 400 Missing Parameter `{ error: 'Username and password required' }`
    - 401 Invalid Credentials `{ error: 'Invalid username or password' }`
    - 500 Server Error `{ error: 'Database error'}`
  
- **User Existence**
  - `GET /api/exists`
  - Response
    - 200 Success `{ exists: true | false }`
    - 400 Missing Parameter `{ error: 'Username required' }`
    - 500 Server Error `{ error: 'Database error'}`
  
- **Get Balance**
  - `GET /api/balance`
  - Auth required (JWT)
  - **Request Header:**
    - `Authorization: Bearer <token>`
  - **Response:**
    - 200 Success: `{ balance }`
    - 401 Unauthorized: `{ "error": "Authorization header missing or invalid" | "Token expired" | "Invalid token" }`
    - 404 User Not Found: `{ "error": "User not found" }`
    - 500 Database Error: `{ "error": "Database error" }`

## Trading Endpoints

- **Place Trade (Buy/Sell)**
  - **UNIMPLEMENTED**
  - `POST /api/trade`
  - Auth required (JWT)
  - Request: `{ type: 'buy' | 'sell', symbol, quantity, price }`
- Response: Trade result
- **Get Trade History**
  - **UNIMPLEMENTED**
  - `GET /api/trades`
  - Auth required (JWT)
- Response: List of user's trades



# Database Schemas

### Users

```sql
users (
  	id INTEGER PRIMARY KEY AUTOINCREMENT,
  	username TEXT UNIQUE,
  	password TEXT,
  	balance REAL DEFAULT 500
)
```

