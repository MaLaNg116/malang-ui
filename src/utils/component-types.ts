/** Extract props from a Vue constructor, generic setup component or props object. */
export type MGetProps<T> = T extends abstract new (...args: never[]) => { $props: infer P } ? P : T extends (props: infer P, ...args: never[]) => unknown ? P : T extends object ? T : never;
type MReturnOrValue<T> = T extends (...args: never[]) => infer R ? R : T;
export type MGetProp<T, K extends keyof MGetProps<T>, Mode extends 'Value' | 'Return' = 'Value'> = Mode extends 'Return' ? MReturnOrValue<NonNullable<MGetProps<T>[K]>> : NonNullable<MGetProps<T>[K]>;
export type MGetRef<T> = T extends abstract new (...args: never[]) => infer R ? R : never;
