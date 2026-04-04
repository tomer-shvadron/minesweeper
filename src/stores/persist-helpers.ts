/**
 * Shared helper for Zustand persist middleware `merge` functions.
 *
 * All persisted stores follow the same pattern:
 * 1. Validate the persisted data against a schema/validator
 * 2. If valid, shallow-merge with the current in-memory state
 * 3. If invalid, return current state unchanged (discard corrupted data)
 *
 * This factory encapsulates that pattern so each store only needs to
 * provide its validator function.
 */
export function createSafeMerge<T extends object>(
  validator: (persisted: unknown) => boolean,
  transform?: (persisted: Record<string, unknown>) => Record<string, unknown>
): (persisted: unknown, current: T) => T {
  return (persisted, current) => {
    if (!validator(persisted)) {
      return current;
    }
    const p = persisted as Record<string, unknown>;
    const transformed = transform ? transform(p) : p;
    return { ...current, ...(transformed as object) };
  };
}
