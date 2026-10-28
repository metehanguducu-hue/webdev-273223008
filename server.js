import { createApp } from './src/app.js';
import { runMigrations } from './src/db/db.js';

// Ensure database and migrations are initialized
runMigrations();

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Club Events server running on http://localhost:${PORT}`);
});
