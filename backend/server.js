// backend/server.js  (CommonJS sürümü)
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db.js');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- CORS ayarları ---
const FRONTEND_ORIGINS = [
  process.env.FRONTEND_URL || '',
  'https://yagmusapp.com',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({ origin: FRONTEND_ORIGINS }));

// --- DB yardımcı fonksiyonlar ---
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err, info) => (err ? reject(err) : resolve(info)));
  });
}

// --- Healthcheck ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Notes: listele ---
app.get('/api/notes', async (_req, res) => {
  try {
    const q = `
      SELECT n.id,
             n.userId AS "userId",
             n.content,
             n.createdAt AS "createdAt",
             COALESCE(u.username, '') AS username
      FROM notes n
      LEFT JOIN users u ON u.id = n.userId
      ORDER BY n.createdAt DESC
    `;
    const rows = await dbAll(q);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/notes', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// --- Notes: ekle ---
app.post('/api/notes', async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) return res.status(400).json({ message: 'Missing fields' });

    const ins = `INSERT INTO notes (userId, content) VALUES (?, ?)`;
    const info = await dbRun(ins, [userId, content]);
    const lastID = info?.lastID;
    const sel = `
      SELECT n.id, n.userId, n.content, n.createdAt,
             COALESCE(u.username, '') AS username
      FROM notes n
      LEFT JOIN users u ON u.id = n.userId
      WHERE n.id = ?
    `;
    const inserted = await dbGet(sel, [lastID]);
    res.status(201).json(inserted);
  } catch (e) {
    console.error('POST /api/notes', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// --- Auth: kayıt (maks 2 kullanıcı) ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const users = await dbAll(`SELECT id FROM users`);
    if (users.length >= 2) return res.status(403).json({ error: 'User limit reached' });

    const exists = await dbGet(`SELECT id FROM users WHERE username = ?`, [username]);
    if (exists) return res.status(400).json({ error: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const info = await dbRun(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashed]);
    const newId = info?.lastID;

    const user = await dbGet(`SELECT id AS userId, username, createdAt FROM users WHERE id = ?`, [newId]);
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (e) {
    console.error('POST /api/register', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// --- Auth: giriş ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await dbGet(`SELECT id AS userId, username, password FROM users WHERE username = ?`, [username]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    delete user.password;
    res.json({ token, user });
  } catch (e) {
    console.error('POST /api/login', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// --- Error middleware ---
app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('API listening on', PORT));
