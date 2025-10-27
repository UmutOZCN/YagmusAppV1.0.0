// backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db.js');
const bodyParser = require("body-parser");
const path = require("path");
require('dotenv').config();

const app = express();
app.use(express.json());

// Emoji ve uzun metin desteği (UTF-8 güvenliği)
app.use(bodyParser.json({ limit: "1mb", type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// PostgreSQL veya SQLite karakter setini UTF-8'e zorla
process.env.PGCLIENTENCODING = "UTF8";


/* ---------- CORS AYARLARI ---------- */
// .env veya Railway'den FRONTEND_URLS=... olarak gelebilir
const ENV_ORIGINS = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// izinli frontend originleri
const FRONTEND_ORIGINS = Array.from(new Set([
  ...ENV_ORIGINS,
  'https://yagmusapp.up.railway.app', // aktif frontend domain
  'https://yagmusappv100-frontend-production.up.railway.app',
  'https://yagmusapp.com',
  'http://localhost:3000'
]));

app.use(cors({
  origin: (origin, cb) => {
    // curl veya mobil için origin yoksa izin ver
    if (!origin) return cb(null, true);
    const allowed = FRONTEND_ORIGINS.includes(origin);
    if (allowed) return cb(null, true);
    console.warn('CORS blocked origin:', origin);
    return cb(new Error('CORS not allowed for this origin'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Preflight istekleri yakala
app.options('*', cors());

/* ---------- DB Yardımcıları ---------- */
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

/* ---------- HEALTH ---------- */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* ---------- NOTES: LİSTELE ---------- */
app.get('/api/notes', async (_req, res) => {
  try {
    const q = `
      SELECT n.id,
             n.userId AS "userId",
             n.content,
             n.createdAt AS "createdAt",
             n.date AS "date",
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

/* ---------- NOTES: EKLE ---------- */
app.post('/api/notes', async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content)
      return res.status(400).json({ message: 'Missing fields' });

    const ymd = new Date().toISOString().slice(0, 10);

    // 🔹 aynı gün daha önce not var mı kontrolü
    const exists = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM notes WHERE userId = ? AND date = ? LIMIT 1`,
        [userId, ymd],
        (err, row) => (err ? reject(err) : resolve(!!row))
      );
    });

    if (exists) {
      return res
        .status(409)
        .json({ message: 'Bugünlük bir not yeter, yarın yine beklerim 💜' });
    }

    // 🔹 yoksa ekle
    const ins = `INSERT INTO notes (userId, content, date) VALUES (?, ?, ?)`;
    const info = await new Promise((resolve, reject) => {
      db.run(ins, [userId, content, ymd], (err, info) =>
        err ? reject(err) : resolve(info)
      );
    });

    const lastID = info?.lastID;
    const sel = `
      SELECT n.id, n.userId, n.content, n.createdAt, n.date,
             COALESCE(u.username, '') AS username
      FROM notes n
      LEFT JOIN users u ON u.id = n.userId
      WHERE n.id = ?
    `;
    const inserted = await new Promise((resolve, reject) => {
      db.get(sel, [lastID], (err, row) => (err ? reject(err) : resolve(row)));
    });

    res.status(201).json(inserted);
  } catch (e) {
    console.error('POST /api/notes', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});


/* ---------- AUTH: REGISTER ---------- */
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Missing fields' });

    const users = await dbAll(`SELECT id FROM users`);
    if (users.length >= 2)
      return res.status(403).json({ error: 'User limit reached' });

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

/* ---------- AUTH: LOGIN ---------- */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Missing fields' });

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

/* ---------- GENEL HATA ---------- */
app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ message: err.message || 'Server error' });
});

/* ---------- SERVER START ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('🚀 API listening on', PORT));
