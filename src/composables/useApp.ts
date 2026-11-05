import { inject, type InjectionKey } from 'vue';
import type { MToastVariant } from '../components/types';
export interface MFeedbackOptions { content: string; title?: string; type?: MToastVariant; duration?: number; closable?: boolean; key?: string }
export interface MFeedbackHandle { close(): void; update(options: Partial<MFeedbackOptions>): void }
export interface MMessageBoxOptions {
  title: string; message?: string; kind?: 'alert' | 'confirm' | 'prompt'; inputValue?: string;
  inputLabel?: string; confirmLabel?: string; cancelLabel?: string;
  validate?: (value: string, signal: AbortSignal) => boolean | string | void | Promise<boolean | string | void>;
}
export interface MMessageBoxResult { action: 'confirm' | 'cancel' | 'close'; value: string }
export interface MAppContext {
  message(options: string | MFeedbackOptions): MFeedbackHandle;
  notification(options: MFeedbackOptions): MFeedbackHandle;
  messageBox(options: MMessageBoxOptions): Promise<MMessageBoxResult>;
  alert(message: string, title?: string): Promise<MMessageBoxResult>;
  confirm(message: string, title?: string): Promise<MMessageBoxResult>;
  prompt(message: string, title?: string): Promise<MMessageBoxResult>;
  destroyAll(): void;
}
export const mAppKey: InjectionKey<MAppContext> = Symbol('malang-app');
export function useMApp(): MAppContext {
  const app = inject(mAppKey);
  if (!app) throw new Error('useMApp() must be used in a descendant of <MApp>.');
  return app;
}
