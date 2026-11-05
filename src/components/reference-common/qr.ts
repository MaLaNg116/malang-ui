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
export function qrPath(matrix: MQRMatrix, quiet = 4) {
  return matrix.modules.flatMap((row, y) => row.flatMap((dark, x) => dark ? [`M${x + quiet} ${y + quiet}h1v1h-1z`] : [])).join('');
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
