/**
 * Gets an array given an inpu.
 * @param value array/object to get array from.
 * @returns array[]
 */
export function getArrayForArrayOrObject<T>(value?: T[] | T | null): T[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

/**
 * Checks if the input is undefined.
 * @returns true if undefined
 */
export function isUndefined<T>(T: unknown): T is undefined {
  return T === undefined;
}

/**
 * Checks if the input is null.
 * @returns true if null
 */
export function isNull<T>(T: unknown): T is null {
  return T === null;
}
/**
 * Typeguard for arg.
 * @param value arg to check if is of type `T`
 * @param isMatched bool type
 * @returns true if arg is of type `T`
 */
export function typeGuard<T>(value: unknown, isMatched: boolean): value is T {
  return isMatched;
}
