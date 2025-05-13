// src/lib/lottery-utils.ts
export function generateAutoFilledTicket(): number[] {
  const ticket: number[] = [];
  const counts: Record<number, number> = {};
  // All numbers from 1 to 25 are candidates for each pick.
  const allPossibleNumbers = Array.from({ length: 25 }, (_, i) => i + 1);

  while (ticket.length < 10) {
    const randomIndex = Math.floor(Math.random() * allPossibleNumbers.length);
    const num = allPossibleNumbers[randomIndex];

    if ((counts[num] || 0) < 4) {
      ticket.push(num);
      counts[num] = (counts[num] || 0) + 1;
    }
    // If a number cannot be added because its count is 4,
    // the loop continues and picks another random number from allPossibleNumbers.
    // This is acceptable given the constraints (10 picks, max 4 per number from 25 options).
  }
  return ticket.sort((a, b) => a - b);
}

export function countOccurrences(arr: number[]): Record<number, number> {
  return arr.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
}
