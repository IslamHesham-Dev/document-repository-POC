// Pure helper kept separate so version-number behavior is easy to test without
// HTTP, storage, or a database.
export function calculateNextVersionNumber(
  currentMaximum: number | null,
): number {
  return (currentMaximum ?? 0) + 1;
}
