// Layering gate: spec files may use fixtures, page objects, services, and `test.step`, but never drive the browser
// or the HTTP client themselves (see .github/instructions/playwright-tests.instructions.md). Node built-ins only.
// Usage: node ../shared/check-spec-layering.mjs <specs-dir> [...]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RULES = [
  {
    pattern: /\bpage\.(goto|reload|goBack|goForward|click|dblclick|fill|type|press|check|uncheck|selectOption|hover|locator|getBy\w+|waitFor\w*|evaluate\w*|keyboard|mouse|route)\b/,
    message: 'drives the browser directly; add an intent-level method to a page object or component',
  },
  {
    pattern: /\b(request|authenticatedRequest|apiRequest)\.(get|post|put|patch|delete|head|fetch)\s*\(/,
    message: 'calls the HTTP client directly; add a method to a service',
  },
  {
    pattern: /async\s*\(\s*\{[^}]*\b(authenticatedRequest|apiRequest|request|playwright)\b[^}]*\}/,
    message: 'asks for a raw HTTP client fixture; use a service fixture',
  },
  { pattern: /\bwaitForTimeout\s*\(/, message: 'uses a fixed sleep; wait for a condition instead' },
  { pattern: /\b(test|describe)(\.\w+)*\.only\s*\(/, message: 'commits an `.only`' },
];

function specFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return specFiles(path);
    return name.endsWith('.spec.ts') ? [path] : [];
  });
}

/** Blanks comments so a rule is not triggered by prose; line numbers stay the same. */
function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, (match, prefix) => prefix + ' '.repeat(match.length - prefix.length));
}

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error('Usage: node check-spec-layering.mjs <specs-dir> [...]');
  process.exit(2);
}

const violations = [];
let checked = 0;
for (const root of roots) {
  for (const file of specFiles(root)) {
    checked++;
    const source = withoutComments(readFileSync(file, 'utf8'));
    for (const { pattern, message } of RULES) {
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      for (const match of source.matchAll(new RegExp(pattern.source, flags))) {
        const line = source.slice(0, match.index).split('\n').length;
        violations.push(`${relative(process.cwd(), file)}:${line}: "${match[0].replace(/\s+/g, ' ').slice(0, 60)}" ${message}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Layering check failed (${violations.length}):\n${violations.join('\n')}`);
  process.exit(1);
}
console.log(`Layering check passed: ${checked} spec file(s).`);
