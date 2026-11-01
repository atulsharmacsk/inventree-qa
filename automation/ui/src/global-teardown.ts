import path from 'node:path';
import type { FullConfig } from '@playwright/test';
import JSZip from 'jszip';
import { redactArtifacts } from '../../shared/redaction';

// Runs after all tests and before the HTML reporter copies traces into the report.
export default async function globalTeardown(config: FullConfig): Promise<void> {
  const allureResults = path.resolve(__dirname, '..', 'allure-results');
  await redactArtifacts([...config.projects.map((project) => project.outputDir), allureResults], JSZip);
}
