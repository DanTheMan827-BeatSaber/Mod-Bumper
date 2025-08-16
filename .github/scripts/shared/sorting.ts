/**
 * Sorts two strings alphabetically in a case-insensitive manner.
 * @param keyA - The first string to compare.
 * @param keyB - The second string to compare.
 * @returns A negative number if keyA comes before keyB, positive if after, or 0 if equal.
 */
export function caseInsensitiveAbcSorter(keyA: string, keyB: string) {
  return keyA.localeCompare(keyB, undefined, { sensitivity: "base" })
}

/**
 * Sorts two strings alphabetically in a case-sensitive manner.
 * @param keyA - The first string to compare.
 * @param keyB - The second string to compare.
 * @returns A negative number if keyA comes before keyB, positive if after, or 0 if equal.
 */
export function abcSorter(keyA: string, keyB: string) {
  return keyA.localeCompare(keyB, undefined, { sensitivity: "case" })
}

/**
 * Sorts two [key, value] entries by their keys in a case-insensitive manner.
 * @param entryA - The first [key, value] entry to compare.
 * @param entryB - The second [key, value] entry to compare.
 * @returns A negative number if entryA's key comes before entryB's, positive if after, or 0 if equal.
 */
export function caseInsensitiveAbcEntrySorter<T>([keyA,]: [string, T], [keyB,]: [string, T]) {
  return keyA.localeCompare(keyB, undefined, { sensitivity: "base" })
}

/**
 * Sorts two [key, value] entries by their keys in a case-sensitive manner.
 * @param entryA - The first [key, value] entry to compare.
 * @param entryB - The second [key, value] entry to compare.
 * @returns A negative number if entryA's key comes before entryB's, positive if after, or 0 if equal.
 */
export function abcEntrySorter<T>([keyA,]: [string, T], [keyB,]: [string, T]) {
  return keyA.localeCompare(keyB, undefined, { sensitivity: "case" })
}

/**
 * Returns a new record with its entries sorted by key.
 * @param records - The record to sort.
 * @param insensitive - If true, sort keys case-insensitively; otherwise, case-sensitively.
 * @returns A new record with sorted keys.
 */
export function sortRecordsByKey<T>(records: Record<string, T>, insensitive: boolean): Record<string, T> {
  return Object.fromEntries(
    Object.entries(records).sort(insensitive ? caseInsensitiveAbcEntrySorter : abcEntrySorter)
  );
}