type Entries<T> = (keyof T extends infer U
  ? U extends keyof T
    ? [U, T[U]]
    : never
  : never)[];

const entries = <T extends Record<string, unknown>>(obj: T): Entries<T> => {
  return Object.entries(obj) as Entries<T>;
};

export { entries };
export type { Entries };
