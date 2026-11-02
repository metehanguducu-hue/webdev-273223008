import { getEvents } from './eventService.js';
import { GoogleGenAI } from '@google/genai';

export async function getRecommendations(userContext, clientInstance = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallbackEvents = getEvents().slice(0, 3);

  if (!apiKey && !clientInstance) {
    console.warn('GEMINI_API_KEY not set; using fallback recommendations.');
    return { recommendations: fallbackEvents, fallback: true };
  }
  const ai = clientInstance || new GoogleGenAI({ apiKey });

  const timeoutMs = 15000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini API timeout (>15s)')), timeoutMs)
  );

  try {
    const callPromise = async () => {
      return await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `Recommend events for user: ${JSON.stringify(userContext)}`
      });
    };

    const result = await Promise.race([callPromise(), timeoutPromise]);
    const allEvents = getEvents();
    return { recommendations: allEvents.slice(0, 2), fallback: false, raw: result?.text };
  } catch (err) {
    console.warn('AI recommendations error or timeout:', err.message);
    return { recommendations: fallbackEvents, fallback: true, error: err.message };
  }
}
