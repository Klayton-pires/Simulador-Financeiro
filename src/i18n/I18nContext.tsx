import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SupportedLang, TranslationDict, TRANSLATIONS, SUPPORTED_LANGUAGES, LanguageMeta } from './translations';
import { lookupPhrase } from './phraseDictionary';

interface I18nContextType {
  language: SupportedLang;
  setLanguage: (lang: SupportedLang) => void;
  currentLangMeta: LanguageMeta;
  languages: LanguageMeta[];
  t: (key: keyof TranslationDict, fallback?: string) => string;
  tPhrase: (text: string) => string;
  translateAsync: (text: string, context?: string) => Promise<string>;
  translateBatchAsync: (texts: string[], context?: string) => Promise<string[]>;
  isRTL: boolean;
  isAiTranslating: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'nanucloud_user_lang';
const CACHE_KEY_PREFIX = 'nanucloud_ai_tr_';

// Node original text map to allow instant, lossless restoration when switching back to Portuguese
const originalNodeTextMap = new WeakMap<Node, string>();
const translatedNodes = new WeakSet<Node>();

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('nanucloud_lang');
      if (saved && (TRANSLATIONS as any)[saved]) {
        return saved as SupportedLang;
      }
    } catch {}
    return 'pt';
  });

  const [isAiTranslating, setIsAiTranslating] = useState<boolean>(false);
  const isTranslatingRef = useRef<boolean>(false);

  const currentLangMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const isRTL = currentLangMeta.dir === 'rtl';

  // Limpeza de cookies legados do Google Translate caso existam
  const clearLegacyGoogleTranslateCookies = useCallback(() => {
    try {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    } catch {}
  }, []);

  // Synchronize document direction and lang attribute
  useEffect(() => {
    try {
      document.documentElement.dir = currentLangMeta.dir;
      document.documentElement.lang = language;
      localStorage.setItem(STORAGE_KEY, language);
      localStorage.setItem('nanucloud_lang', language);
      clearLegacyGoogleTranslateCookies();
    } catch {}
  }, [language, currentLangMeta, clearLegacyGoogleTranslateCookies]);

  const setLanguage = useCallback((lang: SupportedLang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem('nanucloud_lang', lang);
      clearLegacyGoogleTranslateCookies();
    } catch {}
  }, [clearLegacyGoogleTranslateCookies]);

  // Instant dictionary translation for keys
  const t = useCallback(
    (key: keyof TranslationDict, fallback?: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.pt;
      if (dict && dict[key]) {
        return dict[key];
      }
      const fallbackDict = TRANSLATIONS.pt;
      if (fallbackDict && fallbackDict[key]) {
        return fallbackDict[key];
      }
      return fallback || String(key);
    },
    [language]
  );

  // Instant phrase translation by text
  const tPhrase = useCallback(
    (text: string): string => {
      if (!text || language === 'pt') return text;
      const found = lookupPhrase(text, language);
      return found || text;
    },
    [language]
  );

  // Dynamic AI translation for unknown dynamic texts with client-side localStorage cache
  const translateAsync = useCallback(
    async (text: string, context?: string): Promise<string> => {
      if (!text || !text.trim() || language === 'pt') {
        return text;
      }

      const found = lookupPhrase(text, language);
      if (found) return found;

      const cacheKey = `${CACHE_KEY_PREFIX}${language}_${text.trim()}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;
      } catch {}

      try {
        setIsAiTranslating(true);
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            targetLang: language,
            context
          })
        });

        if (res.ok) {
          const data = await res.json();
          const translated = data.translated || text;
          try {
            localStorage.setItem(cacheKey, translated);
          } catch {}
          return translated;
        }
      } catch (err) {
        console.warn('Dynamic AI translation failed, using fallback:', err);
      } finally {
        setIsAiTranslating(false);
      }

      return text;
    },
    [language]
  );

  // Batch AI translation
  const translateBatchAsync = useCallback(
    async (texts: string[], context?: string): Promise<string[]> => {
      if (!texts || texts.length === 0 || language === 'pt') {
        return texts;
      }

      const results: string[] = [];
      const missingTexts: string[] = [];
      const missingIndices: number[] = [];

      texts.forEach((txt, idx) => {
        const found = lookupPhrase(txt, language);
        if (found) {
          results[idx] = found;
          return;
        }

        const cacheKey = `${CACHE_KEY_PREFIX}${language}_${txt.trim()}`;
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            results[idx] = cached;
            return;
          }
        } catch {}
        missingIndices.push(idx);
        missingTexts.push(txt);
      });

      if (missingTexts.length === 0) {
        return results;
      }

      try {
        setIsAiTranslating(true);
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: missingTexts,
            targetLang: language,
            context
          })
        });

        if (res.ok) {
          const data = await res.json();
          const translatedList = data.translations || [];
          missingIndices.forEach((origIdx, i) => {
            const val = translatedList[i] || missingTexts[i];
            results[origIdx] = val;
            const cacheKey = `${CACHE_KEY_PREFIX}${language}_${missingTexts[i].trim()}`;
            try {
              localStorage.setItem(cacheKey, val);
            } catch {}
          });
          return results;
        }
      } catch (err) {
        console.warn('Batch AI translation error:', err);
      } finally {
        setIsAiTranslating(false);
      }

      // Fallback
      missingIndices.forEach((origIdx, i) => {
        results[origIdx] = missingTexts[i];
      });
      return results;
    },
    [language]
  );

  // Automated DOM text node translation pass
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (language === 'pt') {
      // Revert all modified nodes back to original Portuguese
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      while (node) {
        if (originalNodeTextMap.has(node)) {
          const orig = originalNodeTextMap.get(node);
          if (orig && node.nodeValue !== orig) {
            node.nodeValue = orig;
          }
          translatedNodes.delete(node);
        }
        node = walker.nextNode();
      }
      return;
    }

    // Target language is not pt: translate visible text nodes
    let timeoutId: any = null;

    const translateNodes = () => {
      if (isTranslatingRef.current) return;
      isTranslatingRef.current = true;

      try {
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => {
            const parent = n.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tagName = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'textarea', 'input', 'code', 'pre'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
            const val = n.nodeValue?.trim();
            if (!val || val.length < 2) return NodeFilter.FILTER_REJECT;
            // Skip pure numbers or currency symbols
            if (/^[\d.,%+\-/*=:$\s€¥KzAOA]+$/.test(val)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });

        let current: Node | null = walker.nextNode();
        while (current) {
          const rawText = current.nodeValue || '';
          const trimmed = rawText.trim();

          if (!originalNodeTextMap.has(current)) {
            originalNodeTextMap.set(current, rawText);
          }

          const originalText = originalNodeTextMap.get(current) || rawText;
          const origTrimmed = originalText.trim();

          // Check if we have phrase translation
          const directMatch = lookupPhrase(origTrimmed, language);
          if (directMatch) {
            const replaced = originalText.replace(origTrimmed, directMatch);
            if (current.nodeValue !== replaced) {
              current.nodeValue = replaced;
              translatedNodes.add(current);
            }
          }
          current = walker.nextNode();
        }
      } catch (err) {
        console.warn('DOM text translation error:', err);
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Run translation immediately
    translateNodes();

    // Observe DOM mutations to translate newly mounted components / tab switching
    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(translateNodes, 120);
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: false
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLangMeta,
      languages: SUPPORTED_LANGUAGES,
      t,
      tPhrase,
      translateAsync,
      translateBatchAsync,
      isRTL,
      isAiTranslating
    }),
    [language, setLanguage, currentLangMeta, t, tPhrase, translateAsync, translateBatchAsync, isRTL, isAiTranslating]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export const useI18n = useTranslation;

