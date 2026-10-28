import { getRecommendations } from './recommendation.js';
import { runMigrations } from '../db/db.js';
import assert from 'node:assert';
import fs from 'node:fs';

const testDbPath = './test_rec_database.sqlite';
process.env.DB_PATH = testDbPath;
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

runMigrations();

async function runTests() {
  console.log('Testing [AC-7] AI event recommendation with fake client...');
  const fakeClient = {
    models: {
      async generateContent(params) {
        return { text: 'Mocked recommendation response' };
      }
    }
  };

  const res1 = await getRecommendations({ interests: ['coding'] }, fakeClient);
  assert.strictEqual(res1.fallback, false, '[AC-7] Should not trigger fallback with working fake client');
  assert.ok(res1.recommendations, '[AC-7] Should return recommendations');

  console.log('Testing [AC-8] AI event recommendation fallback on timeout...');
  const slowFakeClient = {
    models: {
      async generateContent(params) {
        await new Promise(resolve => setTimeout(resolve, 4000)); // > 3s timeout
        return { text: 'Too late' };
      }
    }
  };

  const res2 = await getRecommendations({ interests: ['coding'] }, slowFakeClient);
  assert.strictEqual(res2.fallback, true, '[AC-8] Should fall back on timeout');
  assert.ok(res2.recommendations.length > 0, '[AC-8] Should return fallback events');

  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  console.log('All recommendation tests passed successfully!');
}

runTests();
