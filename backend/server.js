// backend/server.js  (CommonJS sürümü — package.json'da "type":"module" eklemeye gerek yok)
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db.js'); // db.js zaten module.exports = db; şeklinde export ediyor
require('dotenv').config();

const app = express();
app.use(express.json());

const FRONTEND_ORIGINS = [
  "https://yagmusappv100-frontend-production.up.railway.app",
  "https://yagmusapp.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: FRONTEND_ORIGINS,
}));

// util: promisify db methods (db.get / db.all / db.run)
function dbGet(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}
function dbAll(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}
function dbRun(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err, info) => err ? reject(err) : resolve(info));
  });
}

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// GET notes (returns array)
app.get('/api/notes', async (req, res) => {
  try {
    // SQLite-style SQL (db wrapper convertSQL handles PG if needed)
    const q = `
      SELECT n.id, n.userId AS "userId", n.content, n.createdAt AS "createdAt",
             COALESCE(u.username, '') as username
      FROM notes n
      LEFT JOIN users u ON u.id = n.userId
      ORDER BY n.createdAt DESC
    `;
    const rows = await dbAll(q);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/notes error', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// POST note
app.post('/api/notes', async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) return res.status(400).json({ message: 'Missing fields' });

    const ins = `INSERT INTO notes (userId, content) VALUES (?, ?)`;
    const info = await dbRun(ins, [userId, content]);
    // info.lastID for sqlite; for PG the db.run wrapper returns lastID in object
    const lastID = info.lastID || info.lastID === 0 ? info.lastID : null;
    // Read back the inserted row (works for both DBs via db.get)
    const sel = `SELECT n.id, n.userId, n.content, n.createdAt, COALESCE(u.username,'') as username FROM notes n LEFT JOIN users u ON u.id = n.userId WHERE n.id = ?`;
    const inserted = await dbGet(sel, [lastID]);
    res.status(201).json(inserted);
  } catch (e) {
    console.error('POST /api/notes error', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// REGISTER (max 2 users)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    // check user count
    const users = await dbAll(`SELECT * FROM users`);
    if (users.length >= 2) return res.status(403).json({ error: 'User limit reached' });

    // check exists
    const exists = await dbGet(`SELECT * FROM users WHERE username = ?`, [username]);
    if (exists) return res.status(400).json({ error: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const ins = `INSERT INTO users (username, password) VALUES (?, ?)`;
    const info = await dbRun(ins, [username, hashed]);
    const newId = info.lastID;

    const user = await dbGet(`SELECT id as userId, username, createdAt FROM users WHERE id = ?`, [newId]);
    // sign token (optional)
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (e) {
    console.error('POST /api/register', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await dbGet(`SELECT id as userId, username, password FROM users WHERE username = ?`, [username]);
    if (!user) return res.status(401).json({ error: 'Invalid cred' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid cred' });

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    // hide password
    delete user.password;
    res.json({ token, user });
  } catch (e) {
    console.error('POST /api/login', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// global error fallback
app.use((err, req, res, next) => {
  console.error('API error middleware:', err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('API listening on', PORT));
