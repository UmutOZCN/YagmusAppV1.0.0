const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.isPostgreSQL = !!process.env.DATABASE_URL;
    this.client = null;
    this.init();
  }

  init() {
    if (this.isPostgreSQL) {
      // PostgreSQL mode
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') 
          ? { rejectUnauthorized: false } 
          : false
      });
      this.client = pool;
      console.log('📦 Using PostgreSQL database');
      
      // Create tables
      this.createTablesPostgreSQL();
    } else {
      // SQLite mode
      let dbPath;
      if (process.env.NODE_ENV === 'production') {
        const dataDir = process.env.DATABASE_PATH || '/data';
        try {
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
        } catch (e) {
          console.error('Could not create data directory:', e.message);
        }
        dbPath = path.join(dataDir, 'database.db');
      } else {
        dbPath = './database.db';
      }
      
      this.client = new sqlite3.Database(dbPath);
      console.log(`📦 Using SQLite database at: ${dbPath}`);
      this.createTablesSQLite();
    }
  }

  // Create tables for PostgreSQL
  createTablesPostgreSQL() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createNotesTable = `
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        content TEXT NOT NULL,
        "imageUrl" TEXT,
        date TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users (id)
      )
    `;

    const createStreaksTable = `
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        "currentStreak" INTEGER DEFAULT 0,
        "bestStreak" INTEGER DEFAULT 0,
        "lastNoteDate" TEXT,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createStreakHistoryTable = `
      CREATE TABLE IF NOT EXISTS streak_history (
        id SERIAL PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        "user1Submitted" INTEGER DEFAULT 0,
        "user2Submitted" INTEGER DEFAULT 0,
        "bothCompleted" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createDailyStatusTable = `
      CREATE TABLE IF NOT EXISTS daily_status (
        id SERIAL PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        "bothCompleted" INTEGER DEFAULT 0,
        "lastCheckTime" TEXT
      )
    `;

    this.client.query(createUsersTable, (err) => { if (err) console.error('Users table error:', err); });
    this.client.query(createNotesTable, (err) => { if (err) console.error('Notes table error:', err); });
    this.client.query(createStreaksTable, (err) => { if (err) console.error('Streaks table error:', err); });
    this.client.query(createStreakHistoryTable, (err) => { if (err) console.error('Streak history table error:', err); });
    this.client.query(createDailyStatusTable, (err) => { if (err) console.error('Daily status table error:', err); });
  }

  // Create tables for SQLite
  createTablesSQLite() {
    this.client.serialize(() => {
      this.client.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      this.client.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT,
        date TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )`);

      this.client.run(`CREATE TABLE IF NOT EXISTS streaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currentStreak INTEGER DEFAULT 0,
        bestStreak INTEGER DEFAULT 0,
        lastNoteDate TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      this.client.run(`CREATE TABLE IF NOT EXISTS streak_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        user1Submitted INTEGER DEFAULT 0,
        user2Submitted INTEGER DEFAULT 0,
        bothCompleted INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      this.client.run(`CREATE TABLE IF NOT EXISTS daily_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        bothCompleted INTEGER DEFAULT 0,
        lastCheckTime TEXT
      )`);
    });
  }

  // Helper methods for both databases
  run(sql, params, callback) {
    if (this.isPostgreSQL) {
      // For PostgreSQL, we need to add RETURNING for INSERT queries
      let query = sql;
      if (sql.trim().toUpperCase().startsWith('INSERT') && !query.includes('RETURNING')) {
        // Extract table name from INSERT statement
        const tableMatch = sql.match(/INSERT INTO\s+(\w+)/i);
        if (tableMatch) {
          query = sql.replace(/INSERT INTO\s+(\w+)/i, `INSERT INTO $1`) + ' RETURNING id';
        }
      }
      
      this.client.query(query, params || [], (err, result) => {
        if (err) return callback(err, null);
        const lastID = result && result.rows && result.rows[0] ? result.rows[0].id : null;
        callback(null, { lastID });
      });
    } else {
      this.client.run(sql, params || [], function(err) {
        if (err) return callback(err, null);
        callback(null, { lastID: this.lastID });
      });
    }
  }

  get(sql, params, callback) {
    if (this.isPostgreSQL) {
      this.client.query(sql, params || [], (err, result) => {
        if (err) return callback(err, null);
        const row = result.rows[0] || null;
        // Convert PostgreSQL column names back to camelCase
        if (row) {
          return callback(null, {
            ...row,
            id: row.id,
            username: row.username,
            createdAt: row.createdAt || row['createdAt']
          });
        }
        callback(null, null);
      });
    } else {
      this.client.get(sql, params || [], callback);
    }
  }

  all(sql, params, callback) {
    if (this.isPostgreSQL) {
      this.client.query(sql, params || [], (err, result) => {
        if (err) return callback(err, null);
        callback(null, result.rows || []);
      });
    } else {
      this.client.all(sql, params || [], callback);
    }
  }

  serialize(callback) {
    if (this.isPostgreSQL) {
      // PostgreSQL doesn't need serialize
      callback();
    } else {
      this.client.serialize(callback);
    }
  }

  close() {
    if (this.isPostgreSQL) {
      this.client.end();
    } else {
      this.client.close();
    }
  }
}

const db = new Database();

module.exports = db;

