import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { getRecommendations } from './recommendation.js';
import { runMigrations } from '../db/db.js';

test('Recommendation Service: [AC-7], [AC-8] and 100% coverage', async () => {
  const testDbPath = './test_rec_database.sqlite';
  process.env.DB_PATH = testDbPath;
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  runMigrations();

  // Test 1: API key missing & no client (fallback branch)
  const oldKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const resMissingKey = await getRecommendations({ interests: ['coding'] }, null);
  assert.strictEqual(resMissingKey.fallback, true, 'Should fall back when GEMINI_API_KEY is missing');

  // Test 2: API key present & null client (default mock client branch)
  process.env.GEMINI_API_KEY = 'test-api-key';
  const resKeyPresent = await getRecommendations({ interests: ['coding'] }, null);
  assert.strictEqual(resKeyPresent.fallback, false, 'Should use default mock client when key is present');

  // Test 3: Successful fake client [AC-7]
  const fakeClient = {
    models: {
      async generateContent(params) {
        return { text: 'Mocked recommendation response' };
      }
    }
  };

  const res1 = await getRecommendations({ interests: ['coding'] }, fakeClient);
  assert.strictEqual(res1.fallback, false, '[AC-7] Should not trigger fallback with working fake client');

  // Test 4: Timeout fallback [AC-8]
  const slowFakeClient = {
    models: {
      async generateContent(params) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        return { text: 'Too late' };
      }
    }
  };

  const res2 = await getRecommendations({ interests: ['coding'] }, slowFakeClient);
  assert.strictEqual(res2.fallback, true, '[AC-8] Should fall back on timeout');

  if (oldKey) {
    process.env.GEMINI_API_KEY = oldKey;
  } else {
    delete process.env.GEMINI_API_KEY;
  }

  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});
