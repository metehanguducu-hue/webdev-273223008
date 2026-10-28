import { getDb, runMigrations } from './db.js';
import assert from 'node:assert';
import fs from 'node:fs';

// Use a temporary test db
const testDbPath = './test_database.sqlite';
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
process.env.DB_PATH = testDbPath;

// Run migrations
runMigrations();
const db = getDb();

// Test 1: Tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'events', 'registrations')").all();
assert.strictEqual(tables.length, 3, 'All 3 tables should exist');

// Test 2: Insert user and event
db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run('dbtest_student1@uni.bg', 'Student Test');
const user = db.prepare("SELECT * FROM users WHERE email = ?").get('dbtest_student1@uni.bg');
assert.ok(user.id, 'User inserted');

db.prepare("INSERT INTO events (title, date, capacity, organizer_id) VALUES (?, ?, ?, ?)").run('Coding Workshop', '2026-11-01', 1, user.id);
const event = db.prepare("SELECT * FROM events WHERE title = ?").get('Coding Workshop');
assert.ok(event.id, 'Event inserted');

// Test 3: Insert registration (AC-1)
db.prepare("INSERT INTO registrations (user_id, event_id) VALUES (?, ?)").run(user.id, event.id);
const reg = db.prepare("SELECT * FROM registrations WHERE user_id = ? AND event_id = ?").get(user.id, event.id);
assert.ok(reg.id, 'Registration inserted');

// Test 4: Duplicate registration throws error (AC-9)
let duplicateThrown = false;
try {
  db.prepare("INSERT INTO registrations (user_id, event_id) VALUES (?, ?)").run(user.id, event.id);
} catch (err) {
  duplicateThrown = true;
  assert.ok(err.message.includes('UNIQUE constraint failed'), 'Should throw unique constraint error on duplicate registration');
}
assert.ok(duplicateThrown, 'Duplicate registration must be prevented by database UNIQUE constraint');

// Cleanup
db.close();
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

console.log('Step 1 DB verification passed successfully!');
