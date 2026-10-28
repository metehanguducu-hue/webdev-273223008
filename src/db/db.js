import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

let dbInstance = null;
let currentDbPath = null;

export function getDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite');
  
  if (!dbInstance || currentDbPath !== dbPath) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    dbInstance = new DatabaseSync(dbPath);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    currentDbPath = dbPath;
  }
  return dbInstance;
}

export function runMigrations() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      location TEXT,
      capacity INTEGER NOT NULL,
      organizer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      UNIQUE(user_id, event_id)
    );
  `);

  // Seed demo data ONLY in development or test environments (never in production), idempotently
  const env = process.env.NODE_ENV || 'development';
  if (env !== 'production') {
    // Seed demo users idempotently
    db.prepare(`
      INSERT OR IGNORE INTO users (email, name) VALUES (?, ?)
    `).run('student1@uni.bg', 'Demo Student 1');

    db.prepare(`
      INSERT OR IGNORE INTO users (email, name) VALUES (?, ?)
    `).run('student2@uni.bg', 'Demo Student 2');

    // Get organizer user id
    const organizer = db.prepare('SELECT id FROM users WHERE email = ?').get('student1@uni.bg');
    if (organizer) {
      // Seed sample events idempotently if none exist
      const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
      if (eventCount === 0) {
        db.prepare(`
          INSERT INTO events (title, description, date, location, capacity, organizer_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          'Web Development Workshop',
          'Learn the basics of HTML, CSS, and Node.js for campus applications.',
          '2026-11-10 10:00:00',
          'Lab 301',
          2,
          organizer.id
        );

        db.prepare(`
          INSERT INTO events (title, description, date, location, capacity, organizer_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          'AI & Machine Learning Seminar',
          'Introduction to LLMs and model integration with Google Gemini API.',
          '2026-11-15 14:00:00',
          'Auditorium A',
          1,
          organizer.id
        );
      }
    }
  }
}
