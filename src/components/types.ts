import type { ButtonHTMLAttributes, InputTypeHTMLAttribute } from 'vue';

export type MButtonVariant = 'primary' | 'secondary' | 'ghost';
export type MControlSize = 'sm' | 'md' | 'lg';

export interface MButtonProps {
  variant?: MButtonVariant;
  size?: MControlSize;
  type?: ButtonHTMLAttributes['type'];
  disabled?: boolean;
  loading?: boolean;
}

export interface MInputProps {
  modelValue?: string;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  type?: InputTypeHTMLAttribute;
  disabled?: boolean;
}

export interface MSwitchProps {
  modelValue?: boolean;
  id?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export interface MTabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export type MTabsActivationMode = 'automatic' | 'manual';

export interface MTabsProps {
  modelValue: string;
  items: readonly MTabItem[];
  label: string;
  activationMode?: MTabsActivationMode;
}

export interface MDialogProps {
  modelValue: boolean;
  title: string;
  description?: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  closeLabel?: string;
}

export interface MCardProps {
  as?: 'article' | 'section' | 'div';
  title?: string;
  description?: string;
  headingTag?: 'h2' | 'h3' | 'h4';
}

export type MToastVariant = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface MMessageProps {
  modelValue: boolean;
  content: string;
  type?: MToastVariant;
  duration?: number;
  closable?: boolean;
  closeLabel?: string;
  offset?: number;
  label?: string;
}

export interface MToastProps {
  presentation?: 'message' | 'notification';
  closable?: boolean;
  modelValue: boolean;
  title: string;
  description?: string;
  variant?: MToastVariant;
  duration?: number;
  closeLabel?: string;
}

export type MToastPlacement = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';

export interface MToastViewportProps {
  placement?: MToastPlacement;
  label?: string;
}

export type MFloatingPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface MPopoverProps {
  modelValue: boolean;
  label: string;
  triggerLabel?: string;
  placement?: MFloatingPlacement;
  disabled?: boolean;
}

export interface MTooltipProps {
  text: string;
  label: string;
  placement?: MFloatingPlacement;
  delay?: number;
  disabled?: boolean;
}

export interface MCheckboxProps {
  modelValue: boolean;
  indeterminate?: boolean;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export interface MChoiceOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface MRadioGroupProps {
  modelValue: string;
  options: readonly MChoiceOption[];
  label: string;
  name?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export interface MSelectProps {
  modelValue: string;
  options: readonly MChoiceOption[];
  id?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export interface MTextareaProps {
  modelValue: string;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
}

export type MStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface MBadgeProps {
  tone?: MStatusTone;
}

export interface MAlertProps {
  title: string;
  description?: string;
  tone?: MStatusTone;
  announce?: boolean;
}

export interface MSpinnerProps {
  label?: string;
  size?: MControlSize;
}

export interface MSkeletonProps {
  lines?: number;
}

export interface MEmptyProps {
  title?: string;
  description?: string;
}

export interface MDividerProps {
  label?: string;
}

export interface MPaginationProps {
  modelValue: number;
  total: number;
  pageSize?: number;
  disabled?: boolean;
  label?: string;
}

export interface MBreadcrumbItem {
  label: string;
  href?: string;
}

export interface MBreadcrumbProps {
  items: readonly MBreadcrumbItem[];
  label?: string;
}

export interface MTableColumn {
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
}

export type MTableRow = Record<string, unknown>;

export interface MTableProps<Row extends object = MTableRow> {
  columns: readonly MTableColumn[];
  rows: readonly Row[];
  caption: string;
  rowKey?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface MDrawerProps extends MDialogProps {
  side?: 'left' | 'right' | 'bottom';
  size?: MControlSize;
}

export interface MMenuAction {
  type?: 'item';
  value: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}

export interface MMenuSeparator { type: 'separator'; key: string }
export type MDropdownMenuItem = MMenuAction | MMenuSeparator;
export interface MDropdownMenuProps {
  modelValue: boolean;
  items: readonly MDropdownMenuItem[];
  label: string;
  triggerLabel?: string;
  placement?: MFloatingPlacement;
  disabled?: boolean;
}

export interface MAccordionItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
export interface MAccordionProps {
  modelValue: readonly string[];
  items: readonly MAccordionItem[];
  label: string;
  multiple?: boolean;
  headingTag?: 'h2' | 'h3' | 'h4';
}

export interface MStepItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
export interface MStepsProps {
  modelValue: string;
  items: readonly MStepItem[];
  label: string;
  interactive?: boolean;
  orientation?: 'horizontal' | 'vertical';
  status?: 'process' | 'error' | 'success';
}

export interface MProgressProps {
  value?: number;
  max?: number;
  label: string;
  indeterminate?: boolean;
  status?: 'default' | 'success' | 'error';
  showValue?: boolean;
}

export type MTimelineStatus = 'neutral' | 'pending' | 'active' | 'success' | 'error';
export interface MTimelineItem {
  value: string;
  title: string;
  description?: string;
  time?: string;
  datetime?: string;
  status?: MTimelineStatus;
}
export interface MTimelineProps {
  items: readonly MTimelineItem[];
  label: string;
  headingTag?: 'h3' | 'h4';
}

export interface MInputNumberProps {
  modelValue: number | null;
  label: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  hint?: string;
  error?: string;
}

export interface MSliderProps {
  modelValue: number;
  label: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  hint?: string;
  error?: string;
  showValue?: boolean;
}

export interface MComboboxProps {
  modelValue: string;
  options: readonly MChoiceOption[];
  label: string;
  id?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export interface MTagProps {
  tone?: MStatusTone;
  closable?: boolean;
  closeLabel?: string;
  disabled?: boolean;
}

export interface MAvatarProps {
  src?: string;
  alt: string;
  name?: string;
  size?: MControlSize;
  tone?: 'ink' | 'seal' | 'jade';
}

export interface MDescriptionItem {
  key: string;
  label: string;
  value?: string | number;
  span?: 1 | 2 | 3;
}
export interface MDescriptionsProps {
  items: readonly MDescriptionItem[];
  label: string;
  columns?: 1 | 2 | 3;
  headingTag?: 'h3' | 'h4';
}

export interface MDatePickerProps {
  modelValue: string;
  label: string;
  id?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export interface MUploadProps {
  modelValue: readonly File[];
  label: string;
  id?: string;
  accept?: string;
  multiple?: boolean;
  maxCount?: number;
  maxSize?: number;
  hint?: string;
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
}

export interface MUploadRejection {
  file: File;
  reason: 'type' | 'size' | 'count' | 'duplicate';
}

export interface MMenuItem {
  value: string;
  label: string;
  href?: string;
  disabled?: boolean;
  children?: readonly MMenuItem[];
}

export interface MMenuProps {
  modelValue: string | null;
  items: readonly MMenuItem[];
  expandedValues: readonly string[];
  label: string;
  id?: string;
  disabled?: boolean;
}

export interface MTreeNode {
  value: string;
  label: string;
  disabled?: boolean;
  children?: readonly MTreeNode[];
}

export interface MTreeProps {
  modelValue: string | null;
  items: readonly MTreeNode[];
  expandedValues: readonly string[];
  label: string;
  id?: string;
  disabled?: boolean;
}

export interface MStatisticProps {
  label: string;
  value?: string | number | null;
  prefix?: string;
  suffix?: string;
  unit?: string;
  description?: string;
  placeholder?: string;
  tone?: MStatusTone;
}

export interface MResultProps {
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  headingTag?: 'h1' | 'h2' | 'h3';
  announce?: boolean;
}

export interface MSpaceProps {
  direction?: 'horizontal' | 'vertical';
  size?: MControlSize | number;
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  wrap?: boolean;
  inline?: boolean;
}

export interface MBackTopProps {
  target?: HTMLElement | (() => HTMLElement | null | undefined);
  visibilityHeight?: number;
  label?: string;
  behavior?: 'smooth' | 'instant';
}

export interface MSegmentedProps {
  modelValue: string;
  options: readonly MChoiceOption[];
  label: string;
  name?: string;
  disabled?: boolean;
  size?: MControlSize;
  block?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export interface MPopconfirmProps {
  modelValue: boolean;
  title: string;
  description?: string;
  triggerLabel?: string;
  confirmText?: string;
  cancelText?: string;
  placement?: MFloatingPlacement;
  disabled?: boolean;
  danger?: boolean;
  beforeConfirm?: (signal: AbortSignal) => void | boolean | Promise<void | boolean>;
}

export interface MImageProps {
  src: string;
  alt: string;
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  loading?: 'eager' | 'lazy';
  preview?: boolean;
  previewSources?: readonly string[];
  initialIndex?: number;
}

export type MFormModel = Record<string, unknown>;
export type MFormErrors = Record<string, string>;
export interface MFormRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (value: unknown, model: Readonly<MFormModel>, signal: AbortSignal) => void | boolean | string | Promise<void | boolean | string>;
}
export type MFormRules = Readonly<Record<string, readonly MFormRule[]>>;
export interface MFormValidation {
  valid: boolean;
  errors: Readonly<MFormErrors>;
  cancelled: boolean;
}
export interface MFormProps {
  model: object;
  rules?: MFormRules;
  label?: string;
  disabled?: boolean;
  validateOn?: 'submit' | 'blur' | 'change';
  showSummary?: boolean;
}
export interface MFormItemProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}
