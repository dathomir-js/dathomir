type Splitter = "-" | "_" | "/" | ".";
type FirstOfString<S extends string> = S extends `${infer F}${string}`
  ? F
  : never;
type RemoveFirstOfString<S extends string> = S extends `${string}${infer R}`
  ? R
  : never;
type IsUpper<S extends string> = S extends Uppercase<S> ? true : false;
type IsLower<S extends string> = S extends Lowercase<S> ? true : false;
type SameLetterCase<X extends string, Y extends string> =
  IsUpper<X> extends IsUpper<Y>
    ? true
    : IsLower<X> extends IsLower<Y>
      ? true
      : false;
type CapitalizedWords<
  T extends readonly string[],
  Accumulator extends string = "",
  Normalize extends boolean | undefined = false,
> = T extends readonly [infer F extends string, ...infer R extends string[]]
  ? CapitalizedWords<
      R,
      `${Accumulator}${Capitalize<Normalize extends true ? Lowercase<F> : F>}`,
      Normalize
    >
  : Accumulator;
type JoinLowercaseWords<
  T extends readonly string[],
  Joiner extends string,
  Accumulator extends string = "",
> = T extends readonly [infer F extends string, ...infer R extends string[]]
  ? Accumulator extends ""
    ? JoinLowercaseWords<R, Joiner, `${Accumulator}${Lowercase<F>}`>
    : JoinLowercaseWords<R, Joiner, `${Accumulator}${Joiner}${Lowercase<F>}`>
  : Accumulator;

type LastOfArray<T extends any[]> = T extends [...any, infer R] ? R : never;
type RemoveLastOfArray<T extends any[]> = T extends [...infer F, any]
  ? F
  : never;

export type CaseOptions = {
  normalize?: boolean;
};

export type SplitByCase<
  T,
  Separator extends string = Splitter,
  Accumulator extends unknown[] = [],
> = string extends Separator
  ? string[]
  : T extends `${infer F}${infer R}`
    ? [LastOfArray<Accumulator>] extends [never]
      ? SplitByCase<R, Separator, [F]>
      : LastOfArray<Accumulator> extends string
        ? R extends ""
          ? SplitByCase<
              R,
              Separator,
              [
                ...RemoveLastOfArray<Accumulator>,
                `${LastOfArray<Accumulator>}${F}`,
              ]
            >
          : SameLetterCase<F, FirstOfString<R>> extends true
            ? F extends Separator
              ? FirstOfString<R> extends Separator
                ? SplitByCase<R, Separator, [...Accumulator, ""]>
                : IsUpper<FirstOfString<R>> extends true
                  ? SplitByCase<
                      RemoveFirstOfString<R>,
                      Separator,
                      [...Accumulator, FirstOfString<R>]
                    >
                  : SplitByCase<R, Separator, [...Accumulator, ""]>
              : SplitByCase<
                  R,
                  Separator,
                  [
                    ...RemoveLastOfArray<Accumulator>,
                    `${LastOfArray<Accumulator>}${F}`,
                  ]
                >
            : IsLower<F> extends true
              ? SplitByCase<
                  RemoveFirstOfString<R>,
                  Separator,
                  [
                    ...RemoveLastOfArray<Accumulator>,
                    `${LastOfArray<Accumulator>}${F}`,
                    FirstOfString<R>,
                  ]
                >
              : SplitByCase<R, Separator, [...Accumulator, F]>
        : never
    : Accumulator extends []
      ? T extends ""
        ? []
        : string[]
      : Accumulator;

export type JoinByCase<T, Joiner extends string> = string extends T
  ? string
  : string[] extends T
    ? string
    : T extends string
      ? SplitByCase<T> extends readonly string[]
        ? JoinLowercaseWords<SplitByCase<T>, Joiner>
        : never
      : T extends readonly string[]
        ? JoinLowercaseWords<T, Joiner>
        : never;

export type PascalCase<
  T,
  Normalize extends boolean | undefined = false,
> = string extends T
  ? string
  : string[] extends T
    ? string
    : T extends string
      ? SplitByCase<T> extends readonly string[]
        ? CapitalizedWords<SplitByCase<T>, "", Normalize>
        : never
      : T extends readonly string[]
        ? CapitalizedWords<T, "", Normalize>
        : never;

export type CamelCase<
  T,
  Normalize extends boolean | undefined = false,
> = string extends T
  ? string
  : string[] extends T
    ? string
    : Uncapitalize<PascalCase<T, Normalize>>;

export type KebabCase<
  T extends string | readonly string[],
  Joiner extends string = "-",
> = JoinByCase<T, Joiner>;

export type SnakeCase<T extends string | readonly string[]> = JoinByCase<
  T,
  "_"
>;

export type TrainCase<
  T,
  Normalize extends boolean | undefined = false,
  Joiner extends string = "-",
> = string extends T
  ? string
  : string[] extends T
    ? string
    : T extends string
      ? SplitByCase<T> extends readonly string[]
        ? CapitalizedWords<SplitByCase<T>, Joiner>
        : never
      : T extends readonly string[]
        ? CapitalizedWords<T, Joiner, Normalize>
        : never;

export type FlatCase<
  T extends string | readonly string[],
  Joiner extends string = "",
> = JoinByCase<T, Joiner>;

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."] as const;

export function isUppercase(char = ""): boolean | undefined {
  if (NUMBER_CHAR_RE.test(char)) {
    return undefined;
  }
  return char !== char.toLowerCase();
}

export function splitByCase<T extends string>(str: T): SplitByCase<T>;
export function splitByCase<
  T extends string,
  Separator extends readonly string[],
>(str: T, separators: Separator): SplitByCase<T, Separator[number]>;
export function splitByCase<
  T extends string,
  Separator extends readonly string[],
>(str: T, separators?: Separator) {
  const splitters = separators ?? STR_SPLITTERS;
  const parts: string[] = [];

  if (!str || typeof str !== "string") {
    return parts as SplitByCase<T, Separator[number]>;
  }

  let buff = "";

  let previousUpper: boolean | undefined;
  let previousSplitter: boolean | undefined;

  for (const char of str) {
    // Splitter
    const isSplitter = (splitters as unknown as string).includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = undefined;
      continue;
    }

    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      // Case rising edge
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      // Case falling edge
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }

    // Normal char
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }

  parts.push(buff);

  return parts as SplitByCase<T, Separator[number]>;
}

export function upperFirst<S extends string>(str: S): Capitalize<S> {
  return (str ? str[0].toUpperCase() + str.slice(1) : "") as Capitalize<S>;
}

export function lowerFirst<S extends string>(str: S): Uncapitalize<S> {
  return (str ? str[0].toLowerCase() + str.slice(1) : "") as Uncapitalize<S>;
}

export function pascalCase(): "";
export function pascalCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(str: T, opts?: CaseOptions): PascalCase<T, UserCaseOptions["normalize"]>;
export function pascalCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(str?: T, opts?: UserCaseOptions) {
  return str
    ? ((Array.isArray(str) ? str : splitByCase(str as string))
        .map((p) => upperFirst(opts?.normalize ? p.toLowerCase() : p))
        .join("") as PascalCase<T, UserCaseOptions["normalize"]>)
    : "";
}

export function camelCase(): "";
export function camelCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(str: T, opts?: UserCaseOptions): CamelCase<T, UserCaseOptions["normalize"]>;
export function camelCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(str?: T, opts?: UserCaseOptions) {
  return lowerFirst(pascalCase(str || "", opts)) as CamelCase<
    T,
    UserCaseOptions["normalize"]
  >;
}

export function kebabCase(): "";
export function kebabCase<T extends string | readonly string[]>(
  str: T,
): KebabCase<T>;
export function kebabCase<
  T extends string | readonly string[],
  Joiner extends string,
>(str: T, joiner: Joiner): KebabCase<T, Joiner>;
export function kebabCase<
  T extends string | readonly string[],
  Joiner extends string,
>(str?: T, joiner?: Joiner) {
  return str
    ? ((Array.isArray(str) ? str : splitByCase(str as string))
        .map((p) => p.toLowerCase())
        .join(joiner ?? "-") as KebabCase<T, Joiner>)
    : "";
}

export function snakeCase(): "";
export function snakeCase<T extends string | readonly string[]>(
  str: T,
): SnakeCase<T>;
export function snakeCase<T extends string | readonly string[]>(str?: T) {
  return kebabCase(str || "", "_") as SnakeCase<T>;
}

export function flatCase(): "";
export function flatCase<T extends string | readonly string[]>(
  str: T,
): FlatCase<T>;
export function flatCase<T extends string | readonly string[]>(str?: T) {
  return kebabCase(str || "", "") as FlatCase<T>;
}

export function trainCase(): "";
export function trainCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(str: T, opts?: UserCaseOptions): TrainCase<T, UserCaseOptions["normalize"]>;
export function trainCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(str?: T, opts?: UserCaseOptions) {
  return (Array.isArray(str) ? str : splitByCase(str as string))
    .filter(Boolean)
    .map((p) => upperFirst(opts?.normalize ? p.toLowerCase() : p))
    .join("-") as TrainCase<T, UserCaseOptions["normalize"]>;
}

const titleCaseExceptions =
  /^(a|an|and|as|at|but|by|for|if|in|is|nor|of|on|or|the|to|with)$/i;

export function titleCase(): "";
export function titleCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(
  str: T,
  opts?: UserCaseOptions,
): TrainCase<T, UserCaseOptions["normalize"], " ">;
export function titleCase<
  T extends string | readonly string[],
  UserCaseOptions extends CaseOptions = CaseOptions,
>(str?: T, opts?: UserCaseOptions) {
  return (Array.isArray(str) ? str : splitByCase(str as string))
    .filter(Boolean)
    .map((p) =>
      titleCaseExceptions.test(p)
        ? p.toLowerCase()
        : upperFirst(opts?.normalize ? p.toLowerCase() : p),
    )
    .join(" ") as TrainCase<T, UserCaseOptions["normalize"]>;
}
