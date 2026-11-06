import entries from './components.json';

export interface CatalogItem {
  name: string;
  label: string;
  category: string;
  description: string;
  keywords: string[];
  source: string;
  storyId: string;
  docsId?: string;
  stories: { id: string; label: string }[];
}

export const componentCatalog: readonly CatalogItem[] = entries;
export const componentCategories = [...new Set(componentCatalog.map((item) => item.category))];

export function workbenchUrl(
  id: string,
  view: 'story' | 'docs',
  theme: 'light' | 'dark',
  palette: string,
  motion: 'standard' | 'reduced',
) {
  const preview = import.meta.env.DEV ? 'http://127.0.0.1:6006/iframe.html' : './workbench/iframe.html';
  const query = new URLSearchParams({ id, viewMode: view, globals: `theme:${theme};palette:${palette};motion:${motion}` });
  return `${preview}?${query}`;
}
