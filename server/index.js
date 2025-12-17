/**
 * Escrow Chainhook Event Server
 * Handles events from Hiro Chainhooks for the Decentralized Escrow Service
 * 
 * Events tracked:
 * - escrow-created
 * - escrow-funded
 * - escrow-released
 * - escrow-disputed
 * - dispute-resolved
 * - fee-collected
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN';

// Initialize SQLite database
const db = new Database('escrow_events.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS escrows (
    escrow_id INTEGER PRIMARY KEY,
    buyer TEXT NOT NULL,
    seller TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER,
    funded_at INTEGER,
    completed_at INTEGER,
    fee_paid INTEGER DEFAULT 0,
    block_height INTEGER,
    tx_id TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    escrow_id INTEGER,
    data TEXT NOT NULL,
    timestamp INTEGER,
    block_height INTEGER,
    tx_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    address TEXT PRIMARY KEY,
    escrows_created INTEGER DEFAULT 0,
    escrows_completed INTEGER DEFAULT 0,
    total_volume INTEGER DEFAULT 0,
    total_fees_paid INTEGER DEFAULT 0,
    first_seen INTEGER,
    last_seen INTEGER
  );

  CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    escrow_id INTEGER,
    fee_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    timestamp INTEGER,
    block_height INTEGER
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    escrows_created INTEGER DEFAULT 0,
    escrows_completed INTEGER DEFAULT 0,
    volume INTEGER DEFAULT 0,
    fees_collected INTEGER DEFAULT 0,
    disputes INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0
  );
`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Helper: Extract event data from Chainhook payload
const extractEventData = (payload) => {
  const events = [];
  
  if (payload.apply && Array.isArray(payload.apply)) {
    for (const block of payload.apply) {
      const blockHeight = block.block_identifier?.index;
      
      if (block.transactions && Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          const txId = tx.transaction_identifier?.hash;
          
          if (tx.metadata?.receipt?.events) {
            for (const event of tx.metadata.receipt.events) {
              if (event.type === 'SmartContractEvent' || event.type === 'print_event') {
                const printData = event.data?.value || event.contract_event?.value;
                if (printData) {
                  events.push({
                    data: printData,
                    blockHeight,
                    txId
                  });
                }
              }
            }
          }
        }
      }
    }
  }
  
  return events;
};

// Helper: Update daily stats
const updateDailyStats = (date, field, increment = 1) => {
  const existing = db.prepare('SELECT * FROM daily_stats WHERE date = ?').get(date);
  
  if (existing) {
    db.prepare(`UPDATE daily_stats SET ${field} = ${field} + ? WHERE date = ?`).run(increment, date);
  } else {
    db.prepare(`INSERT INTO daily_stats (date, ${field}) VALUES (?, ?)`).run(date, increment);
  }
};

// Helper: Update user stats
const updateUser = (address, updates) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const existing = db.prepare('SELECT * FROM users WHERE address = ?').get(address);
  
  if (existing) {
    const sets = Object.entries(updates).map(([k, v]) => `${k} = ${k} + ${v}`).join(', ');
    db.prepare(`UPDATE users SET ${sets}, last_seen = ? WHERE address = ?`).run(timestamp, address);
  } else {
    db.prepare(`
      INSERT INTO users (address, escrows_created, escrows_completed, total_volume, total_fees_paid, first_seen, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      address,
      updates.escrows_created || 0,
      updates.escrows_completed || 0,
      updates.total_volume || 0,
      updates.total_fees_paid || 0,
      timestamp,
      timestamp
    );
  }
};

// Process escrow events
const processEscrowEvent = (eventData, blockHeight, txId) => {
  const today = new Date().toISOString().split('T')[0];
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Store raw event
  db.prepare(`
    INSERT INTO events (event_type, escrow_id, data, timestamp, block_height, tx_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    eventData.event,
    eventData['escrow-id'],
    JSON.stringify(eventData),
    eventData.timestamp || timestamp,
    blockHeight,
    txId
  );
  
  switch (eventData.event) {
    case 'escrow-created':
      db.prepare(`
        INSERT OR REPLACE INTO escrows (escrow_id, buyer, seller, amount, status, created_at, block_height, tx_id)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
      `).run(
        eventData['escrow-id'],
        eventData.buyer,
        eventData.seller,
        eventData.amount,
        eventData.timestamp,
        blockHeight,
        txId
      );
      updateDailyStats(today, 'escrows_created');
      updateUser(eventData.buyer, { escrows_created: 1 });
      console.log(`✅ Escrow #${eventData['escrow-id']} created`);
      break;
      
    case 'escrow-funded':
      db.prepare(`
        UPDATE escrows SET status = 'funded', funded_at = ? WHERE escrow_id = ?
      `).run(eventData.timestamp, eventData['escrow-id']);
      console.log(`💰 Escrow #${eventData['escrow-id']} funded`);
      break;
      
    case 'escrow-released':
      db.prepare(`
        UPDATE escrows SET status = 'released', completed_at = ?, fee_paid = ? WHERE escrow_id = ?
      `).run(eventData.timestamp, eventData.fee, eventData['escrow-id']);
      updateDailyStats(today, 'escrows_completed');
      updateDailyStats(today, 'volume', eventData.amount);
      updateUser(eventData.buyer, { escrows_completed: 1, total_volume: eventData.amount });
      updateUser(eventData.seller, { escrows_completed: 1, total_volume: eventData.amount });
      console.log(`✅ Escrow #${eventData['escrow-id']} released - Amount: ${eventData.amount}`);
      break;
      
    case 'escrow-disputed':
      db.prepare(`
        UPDATE escrows SET status = 'disputed' WHERE escrow_id = ?
      `).run(eventData['escrow-id']);
      updateDailyStats(today, 'disputes');
      console.log(`⚠️ Escrow #${eventData['escrow-id']} disputed`);
      break;
      
    case 'dispute-resolved':
      db.prepare(`
        UPDATE escrows SET status = 'resolved', completed_at = ? WHERE escrow_id = ?
      `).run(eventData.timestamp, eventData['escrow-id']);
      console.log(`✅ Dispute resolved for Escrow #${eventData['escrow-id']} - Winner: ${eventData.winner}`);
      break;
      
    case 'escrow-refunded':
      db.prepare(`
        UPDATE escrows SET status = 'refunded', completed_at = ? WHERE escrow_id = ?
      `).run(eventData.timestamp, eventData['escrow-id']);
      console.log(`↩️ Escrow #${eventData['escrow-id']} refunded`);
      break;
  }
};

// Process fee events
const processFeeEvent = (eventData, blockHeight, txId) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.prepare(`
    INSERT INTO fees (escrow_id, fee_type, amount, timestamp, block_height)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    eventData['escrow-id'],
    eventData['fee-type'],
    eventData.amount,
    eventData.timestamp,
    blockHeight
  );
  
  updateDailyStats(today, 'fees_collected', eventData.amount);
  console.log(`💵 Fee collected: ${eventData.amount} (${eventData['fee-type']})`);
};

// ========================================
// API Routes
// ========================================

// Chainhook event endpoint
app.post('/api/escrow-events', authMiddleware, (req, res) => {
  try {
    const events = extractEventData(req.body);
    
    for (const { data, blockHeight, txId } of events) {
      if (data && data.event) {
        processEscrowEvent(data, blockHeight, txId);
      }
    }
    
    res.status(200).json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Error processing escrow events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fee events endpoint
app.post('/api/fee-events', authMiddleware, (req, res) => {
  try {
    const events = extractEventData(req.body);
    
    for (const { data, blockHeight, txId } of events) {
      if (data && data.event === 'fee-collected') {
        processFeeEvent(data, blockHeight, txId);
      }
    }
    
    res.status(200).json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Error processing fee events:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// Analytics API Routes
// ========================================

// Get overall stats
app.get('/api/stats', (req, res) => {
  const stats = {
    totalEscrows: db.prepare('SELECT COUNT(*) as count FROM escrows').get().count,
    activeEscrows: db.prepare("SELECT COUNT(*) as count FROM escrows WHERE status IN ('pending', 'funded')").get().count,
    totalVolume: db.prepare('SELECT COALESCE(SUM(amount), 0) as sum FROM escrows WHERE status = "released"').get().sum,
    totalFees: db.prepare('SELECT COALESCE(SUM(amount), 0) as sum FROM fees').get().sum,
    totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    totalDisputes: db.prepare("SELECT COUNT(*) as count FROM escrows WHERE status IN ('disputed', 'resolved')").get().count
  };
  res.json(stats);
});

// Get daily stats
app.get('/api/stats/daily', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const stats = db.prepare(`
    SELECT * FROM daily_stats 
    ORDER BY date DESC 
    LIMIT ?
  `).all(days);
  res.json(stats);
});

// Get user stats
app.get('/api/users/:address', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE address = ?').get(req.params.address);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get top users
app.get('/api/users/top/volume', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const users = db.prepare(`
    SELECT * FROM users 
    ORDER BY total_volume DESC 
    LIMIT ?
  `).all(limit);
  res.json(users);
});

// Get escrow details
app.get('/api/escrows/:id', (req, res) => {
  const escrow = db.prepare('SELECT * FROM escrows WHERE escrow_id = ?').get(req.params.id);
  if (!escrow) {
    return res.status(404).json({ error: 'Escrow not found' });
  }
  res.json(escrow);
});

// Get recent escrows
app.get('/api/escrows', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;
  
  let query = 'SELECT * FROM escrows';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  
  const escrows = db.prepare(query).all(...params);
  res.json(escrows);
});

// Get fee history
app.get('/api/fees', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const fees = db.prepare(`
    SELECT * FROM fees 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(limit);
  res.json(fees);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Escrow Chainhook Server running on port ${PORT}`);
  console.log(`📊 Analytics API available at http://localhost:${PORT}/api/stats`);
});

module.exports = app;
