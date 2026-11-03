import type { ButtonHTMLAttributes, InputTypeHTMLAttribute } from 'vue';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost';
export type UiControlSize = 'sm' | 'md' | 'lg';

export interface UiButtonProps {
  variant?: UiButtonVariant;
  size?: UiControlSize;
  type?: ButtonHTMLAttributes['type'];
  disabled?: boolean;
  loading?: boolean;
}

export interface UiInputProps {
  modelValue?: string;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  type?: InputTypeHTMLAttribute;
  disabled?: boolean;
}

export interface UiSwitchProps {
  modelValue?: boolean;
  id?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}
