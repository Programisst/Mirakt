const STOPWORDS = [
  "пенис", "интим", "порно", "порнограф", "эротик", "эротическ", "стриптиз",
  "обнажен", "голый", "голая", "голые", "18+", "xxx", "nsfw",
  "секс ", "секс,", "сексуальн", "проституц", "эскорт", "фетиш", "onlyfans",
  "инцест", "зоофил", "насилие над деть", "педофил",
] as const;

export function isCleanNewsText(title: string, description = ""): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return Boolean(title?.trim()) && !STOPWORDS.some((w) => text.includes(w));
}
