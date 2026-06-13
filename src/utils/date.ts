export function formatDate(ts: Date, lang: string = 'en'): string {
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  return ts.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function readingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
