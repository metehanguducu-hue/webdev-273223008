
import { createApp } from './src/app.js';
import { runMigrations } from './src/db/db.js';

// Check required environment variables before starting
const requiredEnvVars = [
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

for (const variable of requiredEnvVars) {
  if (!process.env[variable]?.trim()) {
    console.error(`Missing ${variable}: see .env.example`);
    process.exit(1);
  }
}

// Initialize database
runMigrations();

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Club Events server running on http://localhost:${PORT}`);
});
