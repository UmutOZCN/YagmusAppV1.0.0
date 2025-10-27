const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;


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

    CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
    
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createNotesTable = `
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    const createStreaksTable = `
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        last_note_date TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createStreakHistoryTable = `
      CREATE TABLE IF NOT EXISTS streak_history (
        id SERIAL PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        user1_submitted INTEGER DEFAULT 0,
        user2_submitted INTEGER DEFAULT 0,
        both_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createDailyStatusTable = `
      CREATE TABLE IF NOT EXISTS daily_status (
        id SERIAL PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        both_completed INTEGER DEFAULT 0,
        last_check_time TEXT
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
      // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
      let query = this.convertSQL(sql);
      
      // For PostgreSQL, we need to add RETURNING for INSERT queries
      if (query.trim().toUpperCase().startsWith('INSERT') && !query.includes('RETURNING')) {
        query += ' RETURNING id';
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
      // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
      const convertedSql = this.convertSQL(sql);
      this.client.query(convertedSql, params || [], (err, result) => {
        if (err) return callback(err, null);
        const row = result.rows[0] || null;
        if (row) {
          // Convert snake_case to camelCase for JavaScript
          return callback(null, this.mapRow(row));
        }
        callback(null, null);
      });
    } else {
      this.client.get(sql, params || [], callback);
    }
  }

  all(sql, params, callback) {
    if (this.isPostgreSQL) {
      // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
      const convertedSql = this.convertSQL(sql);
      this.client.query(convertedSql, params || [], (err, result) => {
        if (err) return callback(err, null);
        // Convert snake_case to camelCase for all rows
        const mappedRows = result.rows.map(row => this.mapRow(row));
        callback(null, mappedRows);
      });
    } else {
      this.client.all(sql, params || [], callback);
    }
  }

  // Convert SQLite syntax to PostgreSQL syntax
  convertSQL(sql) {
    let converted = sql;
    
    // Replace ? placeholders with $1, $2, $3, etc.
    let paramIndex = 1;
    converted = converted.replace(/\?/g, () => `$${paramIndex++}`);
    
    // Convert column names to snake_case for PostgreSQL
    converted = converted
      .replace(/userId/g, 'user_id')
      .replace(/createdAt/g, 'created_at')
      .replace(/imageUrl/g, 'image_url')
      .replace(/currentStreak/g, 'current_streak')
      .replace(/bestStreak/g, 'best_streak')
      .replace(/lastNoteDate/g, 'last_note_date')
      .replace(/updatedAt/g, 'updated_at')
      .replace(/user1Submitted/g, 'user1_submitted')
      .replace(/user2Submitted/g, 'user2_submitted')
      .replace(/bothCompleted/g, 'both_completed')
      .replace(/lastCheckTime/g, 'last_check_time');
    
    return converted;
  }

  // Map PostgreSQL snake_case to JavaScript camelCase
  mapRow(row) {
    const mapped = {};
    for (const key in row) {
      // Convert snake_case to camelCase: created_at -> createdAt, user_id -> userId
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      mapped[camelKey] = row[key];
    }
    return mapped;
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

