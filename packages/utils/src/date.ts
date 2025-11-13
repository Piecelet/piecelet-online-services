/**
 * Formats a date to ISO string
 */
export function formatISO(date: Date | string | number): string {
  return new Date(date).toISOString();
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Gets the difference in days between two dates
 */
export function getDaysDifference(
  date1: Date | string | number,
  date2: Date | string | number
): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Checks if a date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  return new Date(date).getTime() > Date.now();
}
