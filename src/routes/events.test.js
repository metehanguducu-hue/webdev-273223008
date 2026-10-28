import { createApp } from '../app.js';
import { getDb, runMigrations } from '../db/db.js';
import assert from 'node:assert';
import fs from 'node:fs';

const testDbPath = './test_api_database.sqlite';
process.env.DB_PATH = testDbPath;
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

runMigrations();
const db = getDb();

// Seed data
const u1 = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run('apitest1@uni.bg', 'Student One');
const u2 = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run('apitest2@uni.bg', 'Student Two');
const user1Id = u1.lastInsertRowid;
const user2Id = u2.lastInsertRowid;

const e1 = db.prepare("INSERT INTO events (title, date, capacity, organizer_id) VALUES (?, ?, ?, ?)").run('API Test Event 1', '2026-11-01', 1, user1Id);
const e2 = db.prepare("INSERT INTO events (title, date, capacity, organizer_id) VALUES (?, ?, ?, ?)").run('API Test Event 2', '2026-11-02', 5, user1Id);
const event1Id = e1.lastInsertRowid;
const event2Id = e2.lastInsertRowid;

const app = createApp();
const server = app.listen(0);
const port = server.address().port;
const baseUrl = `http://localhost:${port}/api`;

async function runTests() {
  try {
    // 1. Unauthenticated registration attempt
    console.log('Testing unauthenticated registration (401)...');
    let res = await fetch(`${baseUrl}/events/${event1Id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 401, 'Should return 401 when not authenticated');
    let data = await res.json();
    assert.ok(data.error);

    // 2. Successful registration [AC-1] via demo email auth
    console.log('Testing [AC-1] Successful registration via API...');
    res = await fetch(`${baseUrl}/events/${event1Id}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ demoEmail: 'apitest1@uni.bg' })
    });
    assert.strictEqual(res.status, 201, '[AC-1] Should return 201 on successful registration');
    data = await res.json();
    assert.strictEqual(data.success, true);

    // 3. Duplicate registration prevention [AC-9]
    console.log('Testing [AC-9] Duplicate registration prevention via API...');
    res = await fetch(`${baseUrl}/events/${event1Id}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ demoEmail: 'apitest1@uni.bg' })
    });
    assert.strictEqual(res.status, 409, '[AC-9] Should return 409 on duplicate registration');
    data = await res.json();
    assert.ok(data.error, 'Should return error message for duplicate registration');

    // 4. Full event capacity control [AC-2]
    console.log('Testing [AC-2] Full event capacity control via API...');
    // Event 1 has capacity 1 and is already filled by apitest1.
    // apitest2 attempts to register for event 1.
    res = await fetch(`${baseUrl}/events/${event1Id}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ demoEmail: 'apitest2@uni.bg' })
    });
    assert.strictEqual(res.status, 409, '[AC-2] Should return 409 when event is full');
    data = await res.json();
    assert.strictEqual(data.error, 'This event is full', '[AC-2] Error message must be "This event is full"');

    console.log('All API integration tests for [AC-1], [AC-2], [AC-9] passed successfully!');
  } finally {
    server.close();
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  }
}

runTests().catch((err) => {
  server.close();
  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  console.error('API test failed:', err);
  process.exit(1);
});
