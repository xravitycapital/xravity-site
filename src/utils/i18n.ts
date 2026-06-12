// Simple i18n helper
import translations from '../data/translations.json';

export function t(key: string, lang: string = 'en'): string {
  if (lang === 'zh' && (translations as any).zh?.[key]) {
    return (translations as any).zh[key];
  }
  return (translations as any)[key] || key;
}

export const LANG_NAMES: Record<string, string> = {
  en: 'EN',
  zh: '中文'
};
