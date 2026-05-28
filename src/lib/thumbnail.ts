/**
 * Фильтр изображений для новостей.
 *
 * Блокирует только очевидный мусор: логотипы, иконки, фавиконки,
 * спрайты, плейсхолдеры и совсем маленькие картинки.
 * Реальные статейные фото пропускаются.
 *
 * Стоп-токены в URL (любое вхождение → картинка игнорируется):
 *   logo, icon, favicon, sprite, placeholder.
 */
const BLOCK_SUBSTRINGS = [
  "logo",
  "icon",
  "favicon",
  "sprite",
  "placeholder",
];

/** Минимальные допустимые размеры картинки, если заданы прямо в URL. */
const MIN_DIM = 200;

export function isValidNewsImage(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;

  const u = trimmed.toLowerCase();

  // Форматы, которые никогда не бывают статейным фото.
  if (/\.(svg|ico|bmp)(\?|#|$)/.test(u)) return false;

  // Стоп-токены в URL.
  for (const token of BLOCK_SUBSTRINGS) {
    if (u.includes(token)) return false;
  }

  // Явные «пиксельные» трекеры.
  if (/(^|[/_\-.])(1x1|2x2|pixel\.gif)(\b|[/_\-.?&])/.test(u)) return false;

  // Типичные директории интерфейсной графики.
  if (/\/(static|assets)\/(img|icons|logos?)\//.test(u)) return false;

  // Размер, закодированный в URL, вида _200x150, -300x200, /64x64/.
  // Блокируем только если ОБЕ стороны меньше минимума — горизонтальные 16:9
  // превью (300×169, 320×180) валидны, даже если высота < 200.
  const sizeMatch = u.match(/(?:^|[/_\-.])(\d{2,4})x(\d{2,4})(?:[/_\-.?&]|$)/);
  if (sizeMatch) {
    const w = Number(sizeMatch[1]);
    const h = Number(sizeMatch[2]);
    if (w < MIN_DIM && h < MIN_DIM) return false;
  }

  // Квадратные маленькие превью вида 16x16…96x96.
  if (/[/_\-.](16|24|32|48|64|96|128)x(?:16|24|32|48|64|96|128)(?:[/_\-.?&]|$)/.test(u)) return false;

  return true;
}

/** Обратная совместимость со старым API. */
export function shouldUseThematicImage(url: string | undefined | null): boolean {
  return !isValidNewsImage(url);
}
