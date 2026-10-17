export function calculateNextVersionNumber(
  currentMaximum: number | null,
): number {
  return (currentMaximum ?? 0) + 1;
}
