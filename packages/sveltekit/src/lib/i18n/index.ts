import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { zh } from './locales/zh.js';
import { en } from './locales/en.js';

export type Locale = 'zh' | 'en';
export type TranslationKey = string;

const translations = {
  zh,
  en,
};

// Language store
const STORAGE_KEY = 'xfinalw3-locale';

function getInitialLocale(): Locale {
  if (!browser) return 'zh';
  
  // Try to get from localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'zh' || stored === 'en') {
    return stored;
  }
  
  // Try to detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  
  return 'en';
}

export const locale = writable<Locale>(getInitialLocale());

// Update localStorage when locale changes
if (browser) {
  locale.subscribe((value) => {
    localStorage.setItem(STORAGE_KEY, value);
  });
}

// Translation function
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof value === 'string' ? value : path;
}

// Get translation for current locale (non-reactive, for use in functions)
export function t(key: TranslationKey): string {
  const currentLocale = get(locale);
  const translation = translations[currentLocale];
  return getNestedValue(translation, key);
}

// Reactive translation function - use this in Svelte templates
// Usage: $t('key.path') - the $ prefix makes it reactive to locale changes
export const tStore = derived(locale, ($locale) => {
  return (key: TranslationKey) => {
    const translation = translations[$locale];
    const result = getNestedValue(translation, key);
    return result;
  };
});

// Set locale
export function setLocale(newLocale: Locale) {
  locale.set(newLocale);
}

// Get current locale
export function getLocale(): Locale {
  return get(locale);
}

