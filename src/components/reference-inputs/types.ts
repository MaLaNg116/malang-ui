export interface MReferenceFieldProps { label: string; id?: string; name?: string; form?: string; required?: boolean; disabled?: boolean; readonly?: boolean; }
export interface MRadioProps { modelValue: string; value: string; label: string; name?: string; form?: string; required?: boolean; disabled?: boolean; id?: string; hint?: string; error?: string; }
export interface MReferenceTreeOption { value: string; label: string; disabled?: boolean; children?: readonly MReferenceTreeOption[]; }
export interface MCascaderProps extends MReferenceFieldProps { modelValue: readonly string[]; options: readonly MReferenceTreeOption[]; multiple?: boolean; checkedPaths?: readonly (readonly string[])[]; checkStrictly?: boolean; filterable?: boolean; }
export interface MTreeSelectProps extends MReferenceFieldProps { modelValue: string | readonly string[] | null; options: readonly MReferenceTreeOption[]; multiple?: boolean; checkStrictly?: boolean; filterable?: boolean; }
export interface MColorPickerPanelProps extends MReferenceFieldProps { modelValue: string; alpha?: boolean; presets?: readonly string[]; }
export interface MColorPickerProps extends MColorPickerPanelProps {}
export interface MRateProps extends MReferenceFieldProps { modelValue: number; max?: number; step?: 1 | 0.5; clearable?: boolean; texts?: readonly string[]; }
export interface MTransferOption { value: string; label: string; disabled?: boolean; }
export interface MTransferProps extends MReferenceFieldProps { modelValue: readonly string[]; options: readonly MTransferOption[]; titles?: readonly [string, string]; filterable?: boolean; }
export interface MInputOTPProps extends MReferenceFieldProps { modelValue: string; length?: number; type?: 'numeric' | 'text'; masked?: boolean; }
export interface MInputTagProps extends MReferenceFieldProps { modelValue: readonly string[]; max?: number; allowDuplicates?: boolean; separator?: string; }
export interface MMentionOption { value: string; label?: string; disabled?: boolean; }
export interface MMentionProps extends MReferenceFieldProps { modelValue: string; options: readonly MMentionOption[]; prefixes?: readonly string[]; rows?: number; }
export interface MTimePickerProps extends MReferenceFieldProps { modelValue: string; min?: string; max?: string; step?: number; showSeconds?: boolean; }
export interface MTimeSelectProps extends MTimePickerProps { start?: string; end?: string; }
export interface MDatePanelCell { date: string; day: number; inMonth: boolean; selected: boolean; disabled: boolean; today: boolean; }
export interface MDatePickerPanelProps extends MReferenceFieldProps { modelValue: string; min?: string; max?: string; disabledDate?: (date: string) => boolean; }
export interface MCalendarProps extends MDatePickerPanelProps {}
export interface MDateRangePickerProps extends MReferenceFieldProps { modelValue: readonly [string, string] | null; min?: string; max?: string; }
export interface MDateTimePickerProps extends MReferenceFieldProps { modelValue: string; min?: string; max?: string; step?: number; showSeconds?: boolean; }
