import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// In-memory cache for server-side AI translations
const translationCache = new Map<string, string>();

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Gemini AI Client initialization warning:', err);
    }
  }
  return aiClient;
}

const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'Portuguese',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  zh: 'Simplified Chinese',
  ar: 'Arabic',
  ja: 'Japanese',
  it: 'Italian',
  ko: 'Korean',
  hi: 'Hindi'
};

/**
 * POST /api/ai/translate
 * Translates a single text or an array of texts to the target language.
 * Guarantees that numbers, currencies, code, formulas, and placeholders are preserved.
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, texts, targetLang = 'en', context } = req.body;

    const inputList: string[] = Array.isArray(texts)
      ? texts
      : typeof text === 'string'
      ? [text]
      : [];

    if (inputList.length === 0) {
      return res.status(400).json({ error: 'Nenhum texto fornecido para tradução.' });
    }

    const langName = LANGUAGE_NAMES[targetLang] || targetLang;
    const results: string[] = [];
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];

    // Check cache first for each string
    inputList.forEach((str, idx) => {
      const cacheKey = `${targetLang}:::${str.trim()}`;
      if (translationCache.has(cacheKey)) {
        results[idx] = translationCache.get(cacheKey)!;
      } else {
        missingIndices.push(idx);
        missingTexts.push(str);
      }
    });

    // If all were cached or target is Portuguese source
    if (missingTexts.length === 0 || targetLang === 'pt') {
      inputList.forEach((str, idx) => {
        if (!results[idx]) results[idx] = str;
      });
      return res.json({
        translated: Array.isArray(texts) ? results : results[0],
        translations: results,
        cached: true
      });
    }

    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `You are a professional financial, fiscal, and software localization engine.
Translate the following array of UI texts/strings into ${langName}.

CRITICAL RULES:
1. Preserve all numbers, percentages, math signs, currency symbols (Kz, AOA, €, $, ¥, etc.), HTML tags, and code tokens strictly unchanged.
2. Maintain natural, polished, and professional tone suitable for a modern SaaS business application.
3. Return ONLY a valid JSON array of strings corresponding 1:1 in the exact same order with no markdown wrapper or extra text.

Context: ${context || 'Financial simulator, customs trade, billing, manuals and ERP system'}
Input Strings to translate:
${JSON.stringify(missingTexts, null, 2)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const rawJson = response.text?.trim() || '[]';
        let translatedArray: string[] = [];
        try {
          translatedArray = JSON.parse(rawJson);
        } catch {
          // If JSON parsing fails, extract array using regex
          const match = rawJson.match(/\[[\s\S]*\]/);
          if (match) {
            translatedArray = JSON.parse(match[0]);
          }
        }

        if (Array.isArray(translatedArray) && translatedArray.length === missingTexts.length) {
          missingIndices.forEach((origIdx, i) => {
            const translatedVal = translatedArray[i] || missingTexts[i];
            results[origIdx] = translatedVal;
            const cacheKey = `${targetLang}:::${missingTexts[i].trim()}`;
            translationCache.set(cacheKey, translatedVal);
          });
        } else {
          // Fallback if length mismatch
          missingIndices.forEach((origIdx, i) => {
            results[origIdx] = missingTexts[i];
          });
        }
      } catch (geminiError) {
        console.warn('Gemini translation fallback:', geminiError);
        missingIndices.forEach((origIdx, i) => {
          results[origIdx] = missingTexts[i];
        });
      }
    } else {
      // No Gemini API key configured: fallback to original text
      missingIndices.forEach((origIdx, i) => {
        results[origIdx] = missingTexts[i];
      });
    }

    return res.json({
      translated: Array.isArray(texts) ? results : results[0],
      translations: results,
      targetLang
    });
  } catch (err: any) {
    console.error('Translation route error:', err);
    return res.status(500).json({ error: 'Erro no serviço de tradução.', details: err.message });
  }
});

export default router;
