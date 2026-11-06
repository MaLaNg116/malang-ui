import data from './api.json';

export interface ComponentApiProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  expandedType?: string;
}

export interface ComponentApi {
  props: ComponentApiProp[];
  events: { name: string; type: string }[];
  slots: { name: string }[];
  types?: { name: string; source: string }[];
}

export const componentApi: Record<string, ComponentApi> = data;
