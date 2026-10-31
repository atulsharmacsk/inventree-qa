// Run-time knobs passed as build parameters: WORKERS (number or percentage, e.g. 4 or 50%) and RETRIES (number).

/** Parallel workers from WORKERS, or the project default when unset; throws on an invalid value. */
export function workersFromEnv(fallback: number | string | undefined): number | string | undefined {
  const value = process.env.WORKERS?.trim();
  if (!value) return fallback;
  if (/^[1-9]\d*%$/.test(value)) return value;
  if (/^[1-9]\d*$/.test(value)) return Number(value);
  throw new Error(`Invalid WORKERS "${value}"; use a positive number (4) or a percentage (50%)`);
}

/** Retries per failed test from RETRIES, default 2; throws on an invalid value. */
export function retriesFromEnv(): number {
  const value = process.env.RETRIES?.trim();
  if (!value) return 2;
  if (/^\d+$/.test(value)) return Number(value);
  throw new Error(`Invalid RETRIES "${value}"; use 0 or a positive number`);
}
