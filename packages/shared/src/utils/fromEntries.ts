type FromEntries<T extends [PropertyKey, unknown][]> = {
  [K in T[number][0]]: Extract<T[number], [K, unknown]>[1];
};

const fromEntries = <T extends [PropertyKey, unknown][]>(
  entries: T
): FromEntries<T> => {
  return entries.reduce((acc, cur) => {
    return {
      ...acc,
      [cur[0]]: cur[1],
    };
  }, {} as FromEntries<T>);
};

export { fromEntries };
export type { FromEntries };
