type Getter = <T>(atom: ReadableAtom<T>) => T;
type NonFunction<T> = T extends (...args: never[]) => unknown ? never : T;

interface PrimitiveAtom<T> {
  readonly key: string;
  readonly kind: "primitive";
  readonly init: T;
}

interface DerivedAtom<T> {
  readonly key: string;
  readonly kind: "derived";
  readonly read: (get: Getter) => T;
}

type ReadableAtom<T> = PrimitiveAtom<T> | DerivedAtom<T>;
type WritableAtom<T> = PrimitiveAtom<T>;

function atom<T>(key: string, read: (get: Getter) => T): DerivedAtom<T>;
function atom<T>(key: string, initialValue: NonFunction<T>): PrimitiveAtom<T>;
function atom<T>(
  key: string,
  initialValueOrRead: T | ((get: Getter) => T),
): PrimitiveAtom<T> | DerivedAtom<T> {
  if (typeof initialValueOrRead === "function") {
    return Object.freeze({
      key,
      kind: "derived" as const,
      read: initialValueOrRead as (get: Getter) => T,
    });
  }

  return Object.freeze({
    key,
    kind: "primitive" as const,
    init: initialValueOrRead,
  });
}

export { atom };
export type { DerivedAtom, Getter, PrimitiveAtom, ReadableAtom, WritableAtom };
