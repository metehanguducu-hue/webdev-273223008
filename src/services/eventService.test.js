import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { getDb, runMigrations } from '../db/db.js';
import { registerUserForEvent, getEventById } from './eventService.js';

test('Event Service: [AC-1], [AC-2], [AC-9] and error handling', () => {
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

  // Test non-existent event (404)
  assert.throws(() => {
    registerUserForEvent(user1Id, 99999);
  }, (err) => {
    return err.status === 404 && err.message === 'Event not found';
  }, 'Should throw 404 when event does not exist');

  // Test non-existent user (404)
  assert.throws(() => {
    registerUserForEvent(99999, event1Id);
  }, (err) => {
    return err.status === 404 && err.message === 'User not found';
  }, 'Should throw 404 when user does not exist');

  // Test AC-1: Successful registration
  const result1 = registerUserForEvent(user1Id, event1Id);
  assert.strictEqual(result1.success, true, '[AC-1] Should successfully register student 1 for event 1');
  const event1 = getEventById(event1Id);
  assert.strictEqual(event1.registration_count, 1, '[AC-1] Registration count should be 1');

  // Test AC-9: Duplicate registration prevention
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
  const result2 = registerUserForEvent(user2Id, event2Id);
  assert.strictEqual(result2.success, true, 'Student 2 should register for event 2 successfully');

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
});
