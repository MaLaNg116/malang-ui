import { computed, inject, type ComputedRef, type InjectionKey } from 'vue';

export interface MConfig {
  theme: 'light' | 'dark';
  palette: 'paper' | 'celadon' | 'gilt';
  density: 'comfortable' | 'compact';
  motion: 'standard' | 'reduced';
  locale: string;
  dir: 'ltr' | 'rtl';
  messages: Readonly<Record<string, string>>;
}
export type MConfigOverrides = Partial<MConfig>;
export const mConfigKey: InjectionKey<ComputedRef<Readonly<MConfigOverrides>>> = Symbol('malang-config');
const empty = computed<Readonly<MConfigOverrides>>(() => ({}));
const english: Readonly<Record<string, string>> = {
  close: 'Close', confirm: 'Confirm', cancel: 'Cancel', loading: 'Loading', empty: 'No data',
  clear: 'Clear', search: 'Search', previous: 'Previous', next: 'Next', today: 'Today',
  refresh: 'Refresh', copy: 'Copy', copied: 'Copied', edit: 'Edit', save: 'Save', expand: 'Show more',
  collapse: 'Show less', scroll: 'Scrollable content', 'qr.expired': 'Code expired',
  'qr.scanned': 'Scanned', 'qr.invalid': 'Unable to generate QR code',
  'message.content': 'Message content',
};

/** Configuration belongs to the current Vue subtree; no process-global state. */
export function useMConfig() {
  const config = inject(mConfigKey, empty);
  function t(key: string, fallback: string) {
    return config.value.messages?.[key] ?? (config.value.locale?.startsWith('en') ? english[key] : undefined) ?? fallback;
  }
  return { config, t };
}
