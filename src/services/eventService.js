import { getDb } from '../db/db.js';

export function getEvents() {
  const db = getDb();
  const events = db.prepare(`
    SELECT e.*, 
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registration_count
    FROM events e
    ORDER BY e.date ASC
  `).all();
  return events;
}

export function getEventById(eventId) {
  const db = getDb();
  const event = db.prepare(`
    SELECT e.*, 
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registration_count
    FROM events e
    WHERE e.id = ?
  `).get(eventId);
  return event;
}

export function registerUserForEvent(userId, eventId) {
  const db = getDb();

  // Begin transaction for atomicity and capacity control
  db.exec('BEGIN TRANSACTION;');

  try {
    // 1. Check if event exists and get capacity
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    // 2. Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    // 3. Check for duplicate registration (AC-9)
    const existingRegistration = db.prepare(
      'SELECT * FROM registrations WHERE user_id = ? AND event_id = ?'
    ).get(userId, eventId);

    if (existingRegistration) {
      const err = new Error('Already registered for this event');
      err.status = 409;
      throw err;
    }

    // 4. Check capacity (AC-2)
    const regCountRow = db.prepare(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?'
    ).get(eventId);
    const currentCount = regCountRow.count;

    if (currentCount >= event.capacity) {
      const err = new Error('This event is full');
      err.status = 409;
      throw err;
    }

    // 5. Insert registration (AC-1)
    const result = db.prepare(
      'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)'
    ).run(userId, eventId);

    db.exec('COMMIT;');
    return { success: true, registrationId: result.lastInsertRowid };
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
