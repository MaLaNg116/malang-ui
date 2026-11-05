import qrcode from 'qrcode-generator';
export type MQRCodeLevel = 'L' | 'M' | 'Q' | 'H';
export interface MQRMatrix { size: number; modules: readonly (readonly boolean[])[] }

/** UTF-8 byte segments. Temporarily set the encoder only during synchronous addData;
 * restore it so another consumer of qrcode-generator retains its chosen charset. */
export function encodeQRCode(value: string | readonly string[], level: MQRCodeLevel = 'M'): MQRMatrix {
  const segments = typeof value === 'string' ? [value] : value;
  if (!segments.length || !segments.some(Boolean)) throw new Error('二维码内容不能为空');
  if (segments.reduce((total, segment) => total + new TextEncoder().encode(segment).length, 0) > 2953) throw new Error('二维码内容超出容量，请缩短内容');
  const qr = qrcode(0, level);
  const previous = qrcode.stringToBytes;
  try {
    qrcode.stringToBytes = text => Array.from(new TextEncoder().encode(text));
    for (const segment of segments) qr.addData(segment, 'Byte');
  } finally { qrcode.stringToBytes = previous; }
  qr.make();
  const size = qr.getModuleCount();
  return { size, modules: Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => qr.isDark(y, x))) };
}
type Box = { x: number; y: number; width: number; height: number };

function functionZones(size: number): Box[] {
  const zones = [
    { x: 0, y: 0, width: 9, height: 9 },
    { x: size - 8, y: 0, width: 8, height: 9 },
    { x: 0, y: size - 8, width: 9, height: 8 },
    { x: 6, y: 0, width: 1, height: size },
    { x: 0, y: 6, width: size, height: 1 },
  ];
  const version = (size - 17) / 4;
  if (version < 2) return zones;
  if (version >= 7) {
    zones.push({ x: size - 11, y: 0, width: 3, height: 6 }, { x: 0, y: size - 11, width: 6, height: 3 });
  }
  // QR Model 2 alignment centers, spaced by the symbol version. The three
  // centers nearest the finder patterns are omitted.
  const count = Math.floor(version / 7) + 2;
  const stride = 2 * Math.floor((2 * size + 3 * count - 29) / (4 * (count - 1)));
  const centers = Array.from({ length: count }, (_, index) => index === 0 ? 6 : size - 7 - (count - 1 - index) * stride);
  for (const x of centers) for (const y of centers) {
    if (x === 6 && (y === 6 || y === size - 7) || x === size - 7 && y === 6) continue;
    zones.push({ x: x - 2, y: y - 2, width: 5, height: 5 });
  }
  return zones;
}

function contains({ x, y, width, height }: Box, column: number, row: number) {
  return column >= x && column < x + width && row >= y && row < y + height;
}

function cutSquare(x: number, y: number, size: number, cuts: readonly [number, number, number, number]) {
  const [topLeft, topRight, bottomRight, bottomLeft] = cuts;
  const right = x + size, bottom = y + size;
  if (!cuts.some(Boolean)) return `M${x} ${y}h${size}v${size}h-${size}z`;
  return `M${x + topLeft} ${y}H${right - topRight}L${right} ${y + topRight}V${bottom - bottomRight}L${right - bottomRight} ${bottom}H${x + bottomLeft}L${x} ${bottom - bottomLeft}V${y + topLeft}z`;
}

export function qrPath(matrix: MQRMatrix, quiet = 4, ink = false) {
  const { modules, size } = matrix;
  const pieces: string[] = [];
  const finders = ink ? [
    { x: 0, y: 0, width: 7, height: 7 },
    { x: size - 7, y: 0, width: 7, height: 7 },
    { x: 0, y: size - 7, width: 7, height: 7 },
  ] : [];
  const protectedZones = ink ? functionZones(size) : [];
  const darkAt = (x: number, y: number) => modules[y]?.[x] ?? false;
  for (const finder of finders) {
    const x = finder.x + quiet, y = finder.y + quiet;
    pieces.push(
      cutSquare(x, y, 7, [0, .86, 0, .86]),
      // Reverse the winding of the white ring so both SVG and Canvas leave it open.
      `M${x + 1} ${y + 1}v5h5v-5z`,
      cutSquare(x + 2, y + 2, 3, [0, .7, 0, .7]),
    );
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!darkAt(x, y) || finders.some(box => contains(box, x, y))) continue;
    if (!ink || protectedZones.some(box => contains(box, x, y))) {
      pieces.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
      continue;
    }
    const top = !darkAt(x, y - 1), right = !darkAt(x + 1, y), bottom = !darkAt(x, y + 1), left = !darkAt(x - 1, y);
    // The same diagonal cut appears on the finder and exposed data corners.
    // Neighboring modules still share their full edge.
    pieces.push(cutSquare(x + quiet, y + quiet, 1, [
      0,
      top && right ? .38 : 0,
      0,
      bottom && left ? .38 : 0,
    ]));
  }
  return pieces.join('');
}
export function qrContrast(a: string, b: string) {
  const luminance = (hex: string) => {
    if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error('二维码颜色须为不透明的六位十六进制色值');
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c[0]! * .2126 + c[1]! * .7152 + c[2]! * .0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
