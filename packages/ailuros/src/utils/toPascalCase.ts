type ToPascalCase<T extends string> = T extends `${infer First}-${infer Rest}`
  ? `${Capitalize<First>}${ToPascalCase<Rest>}`
  : Capitalize<T>;

const toPascalCase = <T extends string>(str: T): ToPascalCase<T> => {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") as ToPascalCase<T>;
};

export { toPascalCase };
export type { ToPascalCase };
