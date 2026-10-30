// Shared by automation/api and automation/ui. Keep runtime imports to Node built-ins;
// package imports must be `import type` because shared/ has no node_modules of its own.

/** A name no other test run will use, for example `pw-part-1730200000000-x7k2qa`. */
export function uniqueName(prefix: string): string {
  const randomText = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${randomText}`;
}
