export type BlogBlock =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; imageId: number; caption?: string };

export interface BlogDocument { version: 1; blocks: BlogBlock[] }
export interface BlogImage { maHinhAnh: number; duongDan: string; chuThich?: string; thuTu: number }

const isBlogBlock = (value: unknown): value is BlogBlock => {
  if (!value || typeof value !== 'object') return false;
  const block = value as Record<string, unknown>;
  if (block.type === 'heading') return [2, 3, 4].includes(Number(block.level)) && typeof block.text === 'string';
  if (block.type === 'paragraph' || block.type === 'quote') return typeof block.text === 'string';
  if (block.type === 'image') return Number.isInteger(block.imageId) && Number(block.imageId) > 0 && (block.caption === undefined || typeof block.caption === 'string');
  if (block.type === 'list') return Array.isArray(block.items) && block.items.every(x => typeof x === 'string') && (block.ordered === undefined || typeof block.ordered === 'boolean');
  return false;
};

export function parseBlogContent(value?: string | null): { isBlockContent: boolean; blocks: BlogBlock[]; legacy: string } {
  if (!value?.trim()) return { isBlockContent: true, blocks: [], legacy: '' };
  try {
    const parsed = JSON.parse(value) as Partial<BlogDocument>;
    if (parsed.version === 1 && Array.isArray(parsed.blocks) && parsed.blocks.every(isBlogBlock))
      return { isBlockContent: true, blocks: parsed.blocks as BlogBlock[], legacy: '' };
  } catch { /* Nội dung cũ được giữ nguyên, không tự chuyển đổi. */ }
  return { isBlockContent: false, blocks: [{ type: 'paragraph', text: legacyToText(value) }], legacy: value };
}

export const serializeBlogContent = (blocks: BlogBlock[]) => JSON.stringify({ version: 1, blocks });

export function blogExcerpt(value?: string | null): string {
  const parsed = parseBlogContent(value);
  if (!parsed.isBlockContent) return legacyToText(parsed.legacy);
  for (const block of parsed.blocks) {
    if ('text' in block && block.text.trim()) return block.text.trim();
    if (block.type === 'list' && block.items.length) return block.items.join(' · ');
  }
  return '';
}

export function legacyToText(value: string): string {
  return value
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
