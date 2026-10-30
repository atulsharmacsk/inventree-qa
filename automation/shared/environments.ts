// Target InvenTree instances. Select one with ENV=LOCALHOST or ENV=REMOTE (default LOCALHOST).

export const ENVIRONMENTS = {
  LOCALHOST: 'http://localhost',
  REMOTE: 'https://demo.inventree.org',
} as const;

export type Environment = keyof typeof ENVIRONMENTS;

/** The selected environment name; throws on an unknown value so a typo cannot hit the wrong server. */
export function currentEnvironment(): Environment {
  const name = (process.env.ENV ?? 'LOCALHOST').trim().toUpperCase();
  if (!(name in ENVIRONMENTS)) {
    throw new Error(`Unknown ENV "${name}"; use one of ${Object.keys(ENVIRONMENTS).join(', ')}`);
  }
  return name as Environment;
}

/** Base URL of the selected environment, for example `http://localhost`. */
export const baseUrl = (): string => ENVIRONMENTS[currentEnvironment()];
