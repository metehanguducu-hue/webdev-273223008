import express from 'express';
import eventRouter from './routes/events.js';
import path from 'node:path';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), 'src', 'public')));
  app.use('/api', eventRouter);
  return app;
}
