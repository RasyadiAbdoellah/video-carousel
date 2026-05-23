/**
 * Calculates the modulo operation, ensuring a positive result even for negative dividends.
 *
 * @param n - The dividend, which is the number to be divided.
 * @param m - The divisor, which is the number to divide by.
 * @returns The positive remainder after division.
 */
export function mod(n: number, m: number) {
	return ((n % m) + m) % m
}