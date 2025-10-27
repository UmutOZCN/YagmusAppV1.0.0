const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Initialize database
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/database.db' : './database.db';
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  // Users table - limited to 2 users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notes table
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    content TEXT NOT NULL,
    imageUrl TEXT,
    date TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

  // Streaks table
  db.run(`CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currentStreak INTEGER DEFAULT 0,
    bestStreak INTEGER DEFAULT 0,
    lastNoteDate TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Daily streak tracking - tracks if both users submitted notes on each day
  db.run(`CREATE TABLE IF NOT EXISTS streak_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    user1Submitted INTEGER DEFAULT 0,
    user2Submitted INTEGER DEFAULT 0,
    bothCompleted INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Track if today is completed (both users submitted)
  db.run(`CREATE TABLE IF NOT EXISTS daily_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    bothCompleted INTEGER DEFAULT 0,
    lastCheckTime TEXT
  )`);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim tokenı gerekli' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split('T')[0];

// Helper function to check if a date is today
const isToday = (dateString) => dateString === getToday();

// Helper function to check if a date is yesterday
const isYesterday = (dateString) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === yesterday.toISOString().split('T')[0];
};

// Helper function to get current streak from database
const getCurrentStreak = (callback) => {
  db.get('SELECT * FROM streaks LIMIT 1', (err, row) => {
    if (err) {
      return callback(err, null);
    }
    if (!row) {
      // If no streak exists, initialize it
      db.run('INSERT INTO streaks (currentStreak, lastNoteDate) VALUES (0, ?)', getToday(), (err) => {
        if (err) return callback(err, null);
        callback(null, { currentStreak: 0, lastNoteDate: getToday() });
      });
    } else {
      callback(null, row);
    }
  });
};

// Helper function to check if both users submitted notes today
const checkAndUpdateDailyStatus = (callback) => {
  const today = getToday();
  
  // Get all notes for today
  db.all('SELECT DISTINCT userId FROM notes WHERE date = ?', [today], (err, usersToday) => {
    if (err) return callback(err);
    
    const submittedCount = usersToday.length;
    const bothSubmitted = submittedCount === 2;
    
    // Update or insert daily status
    db.run(
      'INSERT OR REPLACE INTO daily_status (date, bothCompleted, lastCheckTime) VALUES (?, ?, ?)',
      [today, bothSubmitted ? 1 : 0, new Date().toISOString()],
      (err) => {
        if (err) return callback(err);
        
        // Now recalculate streak
        recalculateStreak(callback);
      }
    );
  });
};

// Find the longest consecutive streak in all completed days
const findLongestConsecutiveStreak = (sortedDates) => {
  if (sortedDates.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00');
    const currDate = new Date(sortedDates[i] + 'T00:00:00');
    const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
    } else {
      // Gap found
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  return Math.max(maxStreak, currentStreak);
};

// Recalculate streak based on consecutive completed days
const recalculateStreak = (callback) => {
  // Get all completed days
  db.all('SELECT date FROM daily_status WHERE bothCompleted = 1 ORDER BY date ASC', (err, completedDays) => {
    if (err) return callback(err);
    
    if (completedDays.length === 0) {
      // No completed days, streak is 0
      getCurrentStreak((err, streakData) => {
        if (err) return callback(err);
        const best = Math.max(streakData.bestStreak || 0, 0);
        db.run('UPDATE streaks SET currentStreak = 0, bestStreak = ? WHERE id = ?', 
          [best, streakData.id], callback);
      });
      return;
    }
    
    const sortedDates = completedDays.map(d => d.date).sort();
    
    // Find longest consecutive streak overall
    const longestStreak = findLongestConsecutiveStreak(sortedDates);
    
    // Also find current streak from today backwards
    const today = getToday();
    let currentStreakFromToday = 0;
    let checkDate = new Date();
    let daysChecked = 0;
    
    // Check if today is completed
    const todayCompleted = sortedDates.includes(today);
    if (!todayCompleted) {
      // Start from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (sortedDates.includes(checkDateStr)) {
        currentStreakFromToday++;
        checkDate.setDate(checkDate.getDate() - 1);
        daysChecked++;
      } else {
        break;
      }
      
      // Don't check more than 2 years back
      if (daysChecked > 730) break;
    }
    
    // Best streak is the longest consecutive streak found
    const bestStreak = longestStreak;
    // Current streak is from today backwards (or 0 if today is incomplete)
    const newStreak = currentStreakFromToday;
    
    // Update streak record
    getCurrentStreak((err, streakData) => {
      if (err) return callback(err);
      
      const updatedBest = Math.max(streakData.bestStreak || 0, bestStreak);
      db.run('UPDATE streaks SET currentStreak = ?, bestStreak = ? WHERE id = ?', 
        [newStreak, updatedBest, streakData.id], callback);
    });
  });
};

// Check if user count is less than 2
const getUserCount = (callback) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) return callback(err, null);
    callback(null, row.count);
  });
};

// ROUTES

// Register endpoint (limited to 2 users)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    getUserCount((err, count) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (count >= 2) {
        return res.status(403).json({ error: 'Kullanıcı limiti aşıldı. Sadece 2 kullanıcı kayıt olabilir.' });
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Şifre hashleme hatası' });
        }

        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint')) {
              return res.status(409).json({ error: 'Kullanıcı adı zaten kullanılıyor' });
            }
            return res.status(500).json({ error: 'Kayıt başarısız' });
          }

          const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
          res.status(201).json({ token, user: { id: this.lastID, username } });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ error: 'Kimlik doğrulama hatası' });
        }

        if (!isMatch) {
          return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username } });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current streak
app.get('/api/streak', authenticateToken, (req, res) => {
  getCurrentStreak((err, streak) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(streak);
  });
});

// Fix/restore streak - recalculate based on history
app.post('/api/streak/fix', authenticateToken, (req, res) => {
  // Get all completed days
  db.all('SELECT date FROM daily_status WHERE bothCompleted = 1 ORDER BY date ASC', (err, completedDays) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    
    if (completedDays.length === 0) {
      return res.status(400).json({ error: 'Gerçekleştirilmiş gün yok' });
    }
    
    const sortedDates = completedDays.map(d => d.date).sort();
    const today = getToday();
    
    // Find the last consecutive streak before today (or including today if completed)
    let lastConsecutiveStreak = 0;
    let checkDate = new Date();
    let foundGap = false;
    
    // If today is not completed, start from yesterday
    const todayCompleted = sortedDates.includes(today);
    if (!todayCompleted) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days backwards until we find a gap
    while (!foundGap) {
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (sortedDates.includes(checkDateStr)) {
        lastConsecutiveStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        foundGap = true;
      }
      
      // Safety limit
      if (lastConsecutiveStreak > 1000) break;
    }
    
    // Now update the streak with this restored value
    getCurrentStreak((err, streak) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      
      // Update current streak to the last consecutive streak found
      db.run('UPDATE streaks SET currentStreak = ?, updatedAt = ? WHERE id = ?', 
        [lastConsecutiveStreak, new Date().toISOString(), streak.id], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Seri güncellenemedi' });
          }
          
          // Return the fixed streak
          getCurrentStreak((err, fixedStreak) => {
            if (err) {
              return res.status(500).json({ error: 'Veritabanı hatası' });
            }
            res.json({ 
              message: `Seri ${lastConsecutiveStreak} gün olarak geri yüklendi!`, 
              streak: fixedStreak 
            });
          });
        });
    });
  });
});

// Get all notes
app.get('/api/notes', authenticateToken, (req, res) => {
  db.all('SELECT n.*, u.username FROM notes n JOIN users u ON n.userId = u.id ORDER BY n.date DESC, n.createdAt DESC', (err, notes) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(notes);
  });
});

// Submit a note
app.post('/api/notes', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Not içeriği boş olamaz' });
    }

    const today = getToday();

    // Check if user already submitted a note today
    db.get('SELECT * FROM notes WHERE userId = ? AND date = ?', [req.user.id, today], (err, existingNote) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingNote) {
        return res.status(400).json({ error: 'Bugün zaten bir not gönderdin' });
      }

      // Insert note
      db.run('INSERT INTO notes (userId, content, imageUrl, date) VALUES (?, ?, ?, ?)', 
        [req.user.id, content.trim(), null, today], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Not kaydedilemedi: ' + err.message });
        }

        // Check daily status and update streak
        checkAndUpdateDailyStatus((err) => {
          if (err) {
            console.error('Error updating daily status:', err);
          }
        });

        res.status(201).json({
          note: {
            id: this.lastID,
            userId: req.user.id,
            content: content.trim(),
            date: today
          },
          message: 'Not başarıyla gönderildi'
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Get all users (for testing/display)
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, createdAt FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(users);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Yağmuş API çalışıyor' });
});

// Database backup endpoint
app.get('/api/backup', authenticateToken, (req, res) => {
  const fs = require('fs');
  try {
    const backupData = {
      users: [],
      notes: [],
      streaks: [],
      daily_status: []
    };
    
    // Get all data
    db.all('SELECT * FROM users', (err, users) => {
      if (err) return res.status(500).json({ error: 'Backup failed' });
      backupData.users = users;
      
      db.all('SELECT * FROM notes', (err, notes) => {
        if (err) return res.status(500).json({ error: 'Backup failed' });
        backupData.notes = notes;
        
        db.all('SELECT * FROM streaks', (err, streaks) => {
          if (err) return res.status(500).json({ error: 'Backup failed' });
          backupData.streaks = streaks;
          
          db.all('SELECT * FROM daily_status', (err, dailyStatus) => {
            if (err) return res.status(500).json({ error: 'Backup failed' });
            backupData.daily_status = dailyStatus;
            
            res.json({ 
              message: 'Backup successful', 
              data: backupData,
              timestamp: new Date().toISOString()
            });
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 Yağmuş backend çalışıyor, port ${PORT}`);
});

