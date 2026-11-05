export interface MFormListProps<Item extends object> {
  modelValue: readonly Item[];
  name: string;
  label?: string;
  itemKey?: keyof Item | ((item: Item, index: number) => string | number);
  disabled?: boolean;
  min?: number;
  max?: number;
}
