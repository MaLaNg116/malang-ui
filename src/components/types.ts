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

export interface UiTabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export type UiTabsActivationMode = 'automatic' | 'manual';

export interface UiTabsProps {
  modelValue: string;
  items: readonly UiTabItem[];
  label: string;
  activationMode?: UiTabsActivationMode;
}

export interface UiDialogProps {
  modelValue: boolean;
  title: string;
  description?: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  closeLabel?: string;
}

export interface UiCardProps {
  as?: 'article' | 'section' | 'div';
  title?: string;
  description?: string;
  headingTag?: 'h2' | 'h3' | 'h4';
}

export type UiToastVariant = 'info' | 'success' | 'error';

export interface UiToastProps {
  modelValue: boolean;
  title: string;
  description?: string;
  variant?: UiToastVariant;
  duration?: number;
  closeLabel?: string;
}

export type UiToastPlacement = 'top-end' | 'bottom-end';

export interface UiToastViewportProps {
  placement?: UiToastPlacement;
  label?: string;
}

export type UiFloatingPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface UiPopoverProps {
  modelValue: boolean;
  label: string;
  triggerLabel?: string;
  placement?: UiFloatingPlacement;
  disabled?: boolean;
}

export interface UiTooltipProps {
  text: string;
  label: string;
  placement?: UiFloatingPlacement;
  delay?: number;
  disabled?: boolean;
}

export interface UiCheckboxProps {
  modelValue: boolean;
  indeterminate?: boolean;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export interface UiChoiceOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface UiRadioGroupProps {
  modelValue: string;
  options: readonly UiChoiceOption[];
  label: string;
  name?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export interface UiSelectProps {
  modelValue: string;
  options: readonly UiChoiceOption[];
  id?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export interface UiTextareaProps {
  modelValue: string;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
}

export type UiStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface UiBadgeProps {
  tone?: UiStatusTone;
}

export interface UiAlertProps {
  title: string;
  description?: string;
  tone?: UiStatusTone;
  announce?: boolean;
}

export interface UiSpinnerProps {
  label?: string;
  size?: UiControlSize;
}

export interface UiSkeletonProps {
  lines?: number;
}

export interface UiEmptyProps {
  title?: string;
  description?: string;
}

export interface UiDividerProps {
  label?: string;
}

export interface UiPaginationProps {
  modelValue: number;
  total: number;
  pageSize?: number;
  disabled?: boolean;
  label?: string;
}

export interface UiBreadcrumbItem {
  label: string;
  href?: string;
}

export interface UiBreadcrumbProps {
  items: readonly UiBreadcrumbItem[];
  label?: string;
}

export interface UiTableColumn {
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
}

export type UiTableRow = Record<string, unknown>;

export interface UiTableProps<Row extends object = UiTableRow> {
  columns: readonly UiTableColumn[];
  rows: readonly Row[];
  caption: string;
  rowKey?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}
