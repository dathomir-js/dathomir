type PropsOptions = {
  optional?: boolean;
};

const Props = {
  Union: <const T extends (string | number)[]>(
    prop: T,
    options?: PropsOptions
  ) => ({
    __props_type__: "" as T[number],
    prop,
    type: "union",
    options,
  }),
  String: <const T extends string>(options?: PropsOptions) => ({
    __props_type__: "" as T,
    prop: undefined,
    type: "string",
    options,
  }),
  Number: <const T extends number>(options?: PropsOptions) => ({
    __props_type__: "" as unknown as T,
    prop: undefined,
    type: "number",
    options,
  }),
  Boolean: <const T extends boolean>(options?: PropsOptions) => ({
    __props_type__: "" as unknown as T,
    prop: undefined,
    type: "boolean",
    options,
  }),
} as const;

/**
 * Create a Record whose value type is inferred from a single Prop builder result's `__props_type__`.
 * Example:
 *   const color = Props.Union(['red', 'blue'] as const);
 *   type ColorMap = PropsValueRecord<typeof color>; // Record<string, 'red' | 'blue'>
 */
type PropsValueRecord<P extends PropsDictionary> = {
  [K in keyof P]: P[K]["__props_type__"];
};

/**
 * A dictionary constraint: each key maps to a prop object containing at least `__props_type__`.
 * Using this structural constraint (instead of `Record<string, AnyProp>`) preserves the
 * literal union types of each individual prop's `__props_type__` during generic inference.
 * Example keeps `"red" | "blue"` instead of widening to `string`.
 */
type PropsDictionary = {
  [key: string]: {
    __props_type__: unknown;
    type: unknown;
    prop: unknown | unknown[];
    options?: PropsOptions;
  };
};

export { Props };
export type { PropsValueRecord, PropsDictionary };
