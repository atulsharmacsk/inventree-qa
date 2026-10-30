import fs from 'node:fs/promises';
import type { FullConfig } from '@playwright/test';
import JSZip from 'jszip';
import { findTraceFiles, hideSecrets } from '../../shared/redaction';

// Runs after all tests and before the HTML reporter copies traces into the report.
export default async function globalTeardown(config: FullConfig): Promise<void> {
  for (const tracePath of await findTraceFiles(config.projects.map((project) => project.outputDir))) {
    const zip = await JSZip.loadAsync(await fs.readFile(tracePath));
    for (const file of Object.values(zip.files)) {
      if (file.dir) continue;
      // latin1 keeps every byte as-is, so screenshots and other binary files are not damaged.
      const original = (await file.async('nodebuffer')).toString('latin1');
      const cleaned = hideSecrets(original);
      if (cleaned !== original) zip.file(file.name, Buffer.from(cleaned, 'latin1'));
    }
    await fs.writeFile(tracePath, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  }
}
