import express from 'express';
import { registerUserForEvent, getEvents, getEventById } from '../services/eventService.js';
import { getDb } from '../db/db.js';

const router = express.Router();

/**
 * AUTHENTICATION LIMITATION NOTICE:
 * For Exercise 3 (Slice 3), event registration is demonstrated via pre-seeded development student accounts
 * (e.g. student1@uni.bg, student2@uni.bg) rather than a full production login system.
 * In a future project slice, this will be replaced by proper authenticated sessions / JWT tokens (req.user).
 */
function authenticateDemoUser(req, res, next) {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const demoEmail = req.body?.demoEmail || req.headers['x-demo-email'];
  const headerUserId = req.headers['x-user-id'] || req.body?.userId;

  let userId = null;
  const db = getDb();

  if (demoEmail) {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
    if (user) {
      userId = user.id;
    }
  } else if (headerUserId) {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(headerUserId);
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Please select a valid demo student account (e.g. student1@uni.bg)' });
  }

  req.userId = Number(userId);
  next();
}

router.get('/events', (req, res) => {
  try {
    const events = getEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/events/:id', (req, res) => {
  try {
    const event = getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/events/:id/register', authenticateDemoUser, (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.userId;

    const result = registerUserForEvent(userId, eventId);
    res.status(201).json({ success: true, message: 'Successfully registered', ...result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
