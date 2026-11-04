import type { MUploadRejection } from './types';

export interface UploadLimits { accept?: string; multiple: boolean; maxCount?: number; maxSize?: number }
export const fileFingerprint = (file: File) => JSON.stringify([file.name, file.size, file.type.toLowerCase(), file.lastModified]);
export const sameFiles = (left: readonly File[], right: readonly File[]) => left.length === right.length && left.every((file, index) => file === right[index]);
export function countLimit(limits: UploadLimits) {
  const count = Number.isFinite(limits.maxCount) && limits.maxCount! >= 0 ? Math.floor(limits.maxCount!) : Infinity;
  return limits.multiple ? count : Math.min(1, count);
}
export function sizeLimit(limits: UploadLimits) { return Number.isFinite(limits.maxSize) && limits.maxSize! >= 0 ? limits.maxSize! : Infinity; }
export function acceptsFile(file: File, accept = '') {
  const specifiers = accept.toLowerCase().split(',').map(item => item.trim()).filter(item => /^\.[^\s,]+$/.test(item) || /^(?:audio|video|image)\/\*$/.test(item) || /^[\w!#$&^.+-]+\/[\w!#$&^.+-]+$/.test(item));
  if (!specifiers.length) return true;
  const name = file.name.toLowerCase(), type = file.type.toLowerCase();
  return specifiers.some(item => item.startsWith('.') ? name.endsWith(item) : item.endsWith('/*') ? type.startsWith(item.slice(0, -1)) : type === item);
}
/** Metadata deduplication is intentionally not a comparison of file contents. */
export function selectUploadFiles(current: readonly File[], incoming: readonly File[], limits: UploadLimits) {
  const accepted: File[] = [], rejected: MUploadRejection[] = [];
  const seen = new Set(current.map(fileFingerprint));
  for (const file of incoming) {
    let reason: MUploadRejection['reason'] | undefined;
    if (!acceptsFile(file, limits.accept)) reason = 'type';
    else if (file.size > sizeLimit(limits)) reason = 'size';
    else if (seen.has(fileFingerprint(file))) reason = 'duplicate';
    else if ((limits.multiple ? current.length : 0) + accepted.length >= countLimit(limits)) reason = 'count';
    if (reason) rejected.push({ file, reason });
    else { accepted.push(file); seen.add(fileFingerprint(file)); }
  }
  return { next: accepted.length ? limits.multiple ? [...current, ...accepted] : accepted : [...current], accepted, rejected };
}
export function uploadModelError(files: readonly File[], limits: UploadLimits) {
  if (files.length > countLimit(limits)) return '本地文件数量超过允许上限。';
  if (files.some(file => !acceptsFile(file, limits.accept))) return '本地文件列表中含有不支持的文件类型。';
  if (files.some(file => file.size > sizeLimit(limits))) return '本地文件列表中含有超过大小限制的文件。';
  if (new Set(files.map(fileFingerprint)).size !== files.length) return '本地文件列表中含有重复文件。';
  return '';
}
export function fileBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Number((bytes / 1024).toFixed(1))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
  return `${Number((bytes / (1024 * 1024 * 1024)).toFixed(1))} GB`;
}
