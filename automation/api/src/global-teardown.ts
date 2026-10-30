import fs from 'node:fs/promises';
import path from 'node:path';
import type { FullConfig } from '@playwright/test';
import JSZip from 'jszip';
import { findTraceFiles, hideSecrets, redactTextFiles } from '../../shared/redaction';

// Runs once after all tests, before any reporter copies traces into a report.
export default async function globalTeardown(config: FullConfig): Promise<void> {
  const allureResults = path.resolve(__dirname, '..', 'allure-results');
  const folders = [...config.projects.map((project) => project.outputDir), allureResults];
  await redactTextFiles(folders);
  for (const tracePath of await findTraceFiles(folders)) {
    const zip = await JSZip.loadAsync(await fs.readFile(tracePath));
    for (const file of Object.values(zip.files)) {
      if (file.dir) continue;
      // latin1 keeps every byte as-is, so binary entries are not damaged.
      const original = (await file.async('nodebuffer')).toString('latin1');
      const cleaned = hideSecrets(original);
      if (cleaned !== original) zip.file(file.name, Buffer.from(cleaned, 'latin1'));
    }
    await fs.writeFile(tracePath, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  }
}
