/**
 * Common utility types
 */

/**
 * Makes specified keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Optional type
 */
export type Optional<T> = T | undefined;

/**
 * Nullish type
 */
export type Nullish<T> = T | null | undefined;

/**
 * DeepPartial type - makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * DeepRequired type - makes all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * ValueOf type - gets the union of all values of an object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Prettify type - improves type display in IDE
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
