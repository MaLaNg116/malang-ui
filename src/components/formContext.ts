import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { MFormErrors, MFormValidation } from './types';

export interface FormField {
  id: string;
  label: () => string;
  disabled: () => boolean;
  element: () => HTMLElement | undefined;
}
export interface FormContext {
  disabled: ComputedRef<boolean>;
  errors: Ref<MFormErrors>;
  validating: Ref<boolean>;
  required: (name: string) => boolean;
  register: (name: string, field: FormField) => () => void;
  validate: (names?: readonly string[]) => Promise<MFormValidation>;
  blur: (name: string) => void;
}
export const formContextKey: InjectionKey<FormContext> = Symbol('malang-form');
