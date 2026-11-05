/** A small original line icon set. The default slot accepts other SVG paths. */
export const mIconPaths = {
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M18 6 6 18', plus: 'M12 4v16M4 12h16', minus: 'M4 12h16',
  search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrowLeft: 'm10 5-7 7 7 7M3 12h18', arrowRight: 'm14 5 7 7-7 7M3 12h18',
  chevronDown: 'm5 8 7 7 7-7', chevronUp: 'm5 16 7-7 7 7',
  chevronLeft: 'm15 5-7 7 7 7', chevronRight: 'm9 5 7 7-7 7',
  info: 'M12 10v7m0-11v1M7 2h10l5 5v10l-5 5H7l-5-5V7Z',
  warning: 'M12 8v5m0 3v1M12 2 1 21h22Z',
  settings: 'm9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  copy: 'M8 8h13v13H8ZM3 16V3h13', edit: 'm4 16-1 5 5-1L21 7l-4-4Zm10-10 4 4',
  download: 'M12 2v14m-6-6 6 6 6-6M3 16v5h18v-5', upload: 'M12 16V2m-6 6 6-6 6 6M3 16v5h18v-5',
  file: 'M14 2H4v20h16V8Zm0 0v6h6M8 13h8M8 17h6', folder: 'M2 5h8l2 3h10v13H2Z',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  refresh: 'M20 8a9 9 0 1 0 1 8M20 2v6h-6', menu: 'M3 5h18M3 12h18M3 19h18',
  user: 'M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0M3 22v-3a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v3',
  star: 'm12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z',
} as const;
export type MIconName = keyof typeof mIconPaths;
