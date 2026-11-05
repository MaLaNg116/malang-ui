export interface MTypographyProps {
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  modelValue?: string;
  type?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean; italic?: boolean; underline?: boolean; deleted?: boolean; code?: boolean; mark?: boolean;
  ellipsis?: boolean | number; expandable?: boolean; copyable?: boolean; editable?: boolean;
  label?: string;
}
