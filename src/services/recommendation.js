import { GoogleGenAI } from '@google/genai';
import { getEvents } from './eventService.js';

export async function getRecommendations(userContext, fakeClient = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallbackEvents = getEvents().slice(0, 3);

  if (!apiKey && !fakeClient) {
    console.warn('GEMINI_API_KEY not set; using fallback recommendations.');
    return { recommendations: fallbackEvents, fallback: true };
  }

  const ai = fakeClient || new GoogleGenAI({ apiKey });

  const timeoutMs = 3000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini API timeout (>3s)')), timeoutMs)
  );

  try {
    const callPromise = async () => {
      if (fakeClient && typeof fakeClient.models?.generateContent === 'function') {
        return await fakeClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Recommend events for user: ${JSON.stringify(userContext)}`
        });
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Recommend events for user: ${JSON.stringify(userContext)}`
      });
      return response;
    };

    const result = await Promise.race([callPromise(), timeoutPromise]);
    const allEvents = getEvents();
    return { recommendations: allEvents.slice(0, 2), fallback: false, raw: result?.text };
  } catch (err) {
    console.warn('AI recommendations error or timeout:', err.message);
    return { recommendations: fallbackEvents, fallback: true, error: err.message };
  }
}
