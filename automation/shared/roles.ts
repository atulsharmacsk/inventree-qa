// Users the tests can act as. A role's credentials come from <ROLE>_USERNAME / <ROLE>_PASSWORD.

export const ROLES = ['SUPERUSER', 'READER'] as const;

export type Role = (typeof ROLES)[number];

export type Credentials = { username: string; password: string };

/** Credentials for a role, or undefined when the environment does not provide that user. */
export function credentialsFor(role: Role): Credentials | undefined {
  const username = process.env[`${role}_USERNAME`];
  const password = process.env[`${role}_PASSWORD`];
  return username && password ? { username, password } : undefined;
}

/** Every configured password, so trace redaction covers all roles. */
export function configuredPasswords(): string[] {
  return ROLES.map((role) => credentialsFor(role)?.password).filter((password): password is string => !!password);
}

export const missingRoleMessage = (role: Role): string => `No credentials for role ${role} (set ${role}_USERNAME and ${role}_PASSWORD)`;
