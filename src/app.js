
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import eventRouter from './routes/events.js';
import authRouter from './routes/auth.js';
import path from 'node:path';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: 'auto',
      sameSite: 'lax'
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.static(path.join(process.cwd(), 'src', 'public')));

  app.use('/auth', authRouter);
  app.use('/api', eventRouter);

  return app;
}
