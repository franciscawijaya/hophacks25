const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Open (or create) the database
const db = new sqlite3.Database('./user.db');

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'test_jwt_secret'; // Replace with a secure secret in production

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  balance REAL DEFAULT 500
)`);

// Create portfolio table if not exists
db.run(`CREATE TABLE IF NOT EXISTS portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  symbol TEXT,
  quantity REAL,
  price_per_unit_bought REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, symbol)
)`);

// User registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash],
      function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});


// User login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });
    // Generate JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  });
});

// Check if username exists
router.get('/exists', (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }
  db.get('SELECT 1 FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  });
});

// Generic function for JWT authentication
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get user balance
router.get('/balance', authenticateJWT, (req, res) => {
  const userId = req.userId;
  const includePortfolio = req.query.includePortfolio === 'true';
  
  if (includePortfolio) {
    // Get both balance and portfolio
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      db.all('SELECT symbol, quantity, price_per_unit_bought FROM portfolio WHERE user_id = ?', [userId], (err, portfolio) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ 
          balance: user.balance, 
          portfolio: portfolio 
        });
      });
    });
  } else {
    // Get only balance
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ balance: row.balance });
    });
  }
});

// Get user portfolio
router.get('/portfolio', authenticateJWT, (req, res) => {
  const userId = req.userId;
  db.all('SELECT symbol, quantity, price_per_unit_bought FROM portfolio WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ portfolio: rows });
  });
});

// Add or update position in portfolio
router.post('/portfolio', authenticateJWT, (req, res) => {
  const userId = req.userId;
  const { symbol, quantity, price } = req.body;
  
  if (!symbol || !quantity || !price) {
    return res.status(400).json({ error: 'Symbol, quantity, and price are required' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be positive' });
  }

  if (price <= 0) {
    return res.status(400).json({ error: 'Price must be positive' });
  }

  const totalCost = quantity * price;

  // Check if user has sufficient balance
  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check if position already exists
    db.get('SELECT * FROM portfolio WHERE user_id = ? AND symbol = ?', [userId, symbol], (err, existingPosition) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (existingPosition) {
        // Add to existing position - keep the original purchase price
        const newQuantity = existingPosition.quantity + quantity;
        
        db.run('UPDATE portfolio SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND symbol = ?',
          [newQuantity, userId, symbol], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            // Update user balance
            db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCost, userId], (err) => {
              if (err) return res.status(500).json({ error: 'Database error' });
              res.json({ message: 'Position updated successfully' });
            });
          });
      } else {
        // Create new position
        db.run('INSERT INTO portfolio (user_id, symbol, quantity, price_per_unit_bought) VALUES (?, ?, ?, ?)',
          [userId, symbol, quantity, price], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            // Update user balance
            db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCost, userId], (err) => {
              if (err) return res.status(500).json({ error: 'Database error' });
              res.json({ message: 'Position added successfully' });
            });
          });
      }
    });
  });
});

// Sell position (reduce quantity)
router.post('/portfolio/sell', authenticateJWT, (req, res) => {
  const userId = req.userId;
  const { symbol, quantity, price } = req.body;
  
  if (!symbol || !quantity || !price) {
    return res.status(400).json({ error: 'Symbol, quantity, and price are required' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be positive' });
  }

  if (price <= 0) {
    return res.status(400).json({ error: 'Price must be positive' });
  }

  // Check if position exists and has sufficient quantity
  db.get('SELECT * FROM portfolio WHERE user_id = ? AND symbol = ?', [userId, symbol], (err, position) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!position) return res.status(404).json({ error: 'Position not found' });
    
    if (position.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity to sell' });
    }

    const totalValue = quantity * price;
    const newQuantity = position.quantity - quantity;

    if (newQuantity === 0) {
      // Delete position if quantity becomes zero
      db.run('DELETE FROM portfolio WHERE user_id = ? AND symbol = ?', [userId, symbol], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        // Update user balance
        db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [totalValue, userId], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          res.json({ message: 'Position sold and removed successfully' });
        });
      });
    } else {
      // Update position quantity
      db.run('UPDATE portfolio SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND symbol = ?',
        [newQuantity, userId, symbol], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          
          // Update user balance
          db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [totalValue, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Position sold successfully' });
          });
        });
    }
  });
});

// Delete position completely
router.delete('/portfolio/:symbol', authenticateJWT, (req, res) => {
  const userId = req.userId;
  const { symbol } = req.params;
  
  // Get current position value
  db.get('SELECT * FROM portfolio WHERE user_id = ? AND symbol = ?', [userId, symbol], (err, position) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!position) return res.status(404).json({ error: 'Position not found' });
    
    // Delete position
    db.run('DELETE FROM portfolio WHERE user_id = ? AND symbol = ?', [userId, symbol], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      // Refund the position value to user balance
      const refundValue = position.quantity * position.price_per_unit_bought;
      db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [refundValue, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Position deleted successfully' });
      });
    });
  });
});

module.exports = router;
