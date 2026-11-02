import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getDb } from '../db/db.js';

const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.PUBLIC_BASE_URL}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const emailVerified =
      profile.emails?.[0]?.verified === true ||
      profile._json?.email_verified === true;

    if (!email || !emailVerified) {
      return done(null, false);
    }
    const db = getDb();

    db.prepare(
      'INSERT OR IGNORE INTO users (email, name) VALUES (?, ?)'
    ).run(email, profile.displayName || email);

    const user = db.prepare(
      'SELECT id, email, name FROM users WHERE email = ?'
    ).get(email);

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = getDb().prepare(
      'SELECT id, email, name FROM users WHERE id = ?'
    ).get(id);

    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/?login=failed'
  }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/me', (req, res) => {
  res.json({
    user: req.user || null
  });
});

router.post('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    res.json({ success: true });
  });
});

export default router;
