import { getDb, runMigrations } from '../db/db.js';
import { registerUserForEvent, getEventById } from './eventService.js';
import assert from 'node:assert';
import fs from 'node:fs';

const testDbPath = './test_service_database.sqlite';
process.env.DB_PATH = testDbPath;
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

runMigrations();
const db = getDb();

// Seed test users and events
const u1 = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run('srvtest1@uni.bg', 'Student One');
const u2 = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run('srvtest2@uni.bg', 'Student Two');
const user1Id = u1.lastInsertRowid;
const user2Id = u2.lastInsertRowid;

const e1 = db.prepare("INSERT INTO events (title, date, capacity, organizer_id) VALUES (?, ?, ?, ?)").run('Small Workshop', '2026-11-01', 1, user1Id);
const e2 = db.prepare("INSERT INTO events (title, date, capacity, organizer_id) VALUES (?, ?, ?, ?)").run('Strict Capacity Workshop', '2026-11-02', 1, user1Id);
const event1Id = e1.lastInsertRowid;
const event2Id = e2.lastInsertRowid;

// Test AC-1: Successful registration
console.log('Testing [AC-1] Successful registration...');
const result1 = registerUserForEvent(user1Id, event1Id);
assert.strictEqual(result1.success, true, '[AC-1] Should successfully register student 1 for event 1');
const event1 = getEventById(event1Id);
assert.strictEqual(event1.registration_count, 1, '[AC-1] Registration count should be 1');

// Test AC-9: Duplicate registration prevention
console.log('Testing [AC-9] Duplicate registration prevention...');
let duplicateError = null;
try {
  registerUserForEvent(user1Id, event1Id);
} catch (err) {
  duplicateError = err;
}
assert.ok(duplicateError, '[AC-9] Should throw error on duplicate registration');
assert.strictEqual(duplicateError.status, 409, '[AC-9] Duplicate registration should return status 409');
const event1AfterDup = getEventById(event1Id);
assert.strictEqual(event1AfterDup.registration_count, 1, '[AC-9] Registration count should remain 1');

// Test AC-2: Full event capacity control
console.log('Testing [AC-2] Full event capacity control...');
// Event 2 has capacity 1. Student 2 registers.
const result2 = registerUserForEvent(user2Id, event2Id);
assert.strictEqual(result2.success, true, 'Student 2 should register for event 2 successfully');

// Student 1 attempts to register for event 2 which is now full (capacity 1, count 1)
let fullError = null;
try {
  registerUserForEvent(user1Id, event2Id);
} catch (err) {
  fullError = err;
}
assert.ok(fullError, '[AC-2] Should throw error when event is full');
assert.strictEqual(fullError.status, 409, '[AC-2] Full event error should have status 409');
assert.strictEqual(fullError.message, 'This event is full', '[AC-2] Error message should be "This event is full"');

// Cleanup
db.close();
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

console.log('All Service Layer tests for [AC-1], [AC-2], [AC-9] passed successfully!');
