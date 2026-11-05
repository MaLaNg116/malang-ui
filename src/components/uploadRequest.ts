import type { MUploadRequestOptions } from './types';

/** Native transport is created only for a mounted, explicitly configured job. */
export function uploadRequest(options: MUploadRequestOptions, browser: Window & typeof globalThis): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let xhr: XMLHttpRequest | undefined, settled = false;
    const abortError = () => new browser.DOMException('上传已取消。', 'AbortError');
    function cleanup() {
      options.signal.removeEventListener('abort', abort);
      if (xhr) { xhr.onload = null; xhr.onerror = null; xhr.onabort = null; xhr.ontimeout = null; xhr.upload.onprogress = null; }
    }
    function finish(error?: unknown, response?: unknown) { if (settled) return; settled = true; cleanup(); if (error !== undefined) reject(error); else resolve(response); }
    function abort() { xhr?.abort(); finish(abortError()); }
    if (options.signal.aborted) { finish(abortError()); return; }
    try {
      const url = new URL(options.action, browser.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('上传地址需要 HTTP 或 HTTPS。');
      if (!options.action.trim()) throw new Error('请提供上传地址。');
      const body = new browser.FormData();
      for (const [name, value] of Object.entries(options.data)) {
        for (const entry of Array.isArray(value) ? value : [value]) {
          if (entry === null || entry === undefined) continue;
          if (entry instanceof browser.Blob) body.append(name, entry);
          else body.append(name, String(entry));
        }
      }
      body.append(options.fieldName || 'file', options.file, options.file.name);
      xhr = new browser.XMLHttpRequest(); xhr.open(options.method || 'POST', url.href, true); xhr.withCredentials = options.withCredentials;
      for (const [name, value] of Object.entries(options.headers)) xhr.setRequestHeader(name, value);
      xhr.upload.onprogress = event => { if (!settled && !options.signal.aborted) options.onProgress({ loaded: event.loaded, total: event.lengthComputable ? event.total : undefined, percent: event.lengthComputable && event.total > 0 ? event.loaded / event.total * 100 : undefined }); };
      xhr.onload = () => {
        let response: unknown = xhr!.responseText;
        try { response = xhr!.responseText ? JSON.parse(xhr!.responseText) : null; } catch { /* Text is a valid server response. */ }
        if (xhr!.status >= 200 && xhr!.status < 300) finish(undefined, response);
        else finish(Object.assign(new Error(`上传失败（HTTP ${xhr!.status}）。`), { status: xhr!.status, response }));
      };
      xhr.onerror = () => finish(new Error('网络请求失败，请重试。'));
      xhr.ontimeout = () => finish(new Error('上传请求超时，请重试。'));
      xhr.onabort = () => finish(abortError());
      options.signal.addEventListener('abort', abort, { once: true });
      if (options.signal.aborted) abort(); else xhr.send(body);
    } catch (error) { finish(error); }
  });
}
