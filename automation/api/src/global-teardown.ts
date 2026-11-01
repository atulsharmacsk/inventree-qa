import path from 'node:path';
import type { FullConfig } from '@playwright/test';
import JSZip from 'jszip';
import { redactArtifacts } from '../../shared/redaction';

// Runs once after all tests, before any reporter copies traces into a report.
export default async function globalTeardown(config: FullConfig): Promise<void> {
  const allureResults = path.resolve(__dirname, '..', 'allure-results');
  await redactArtifacts([...config.projects.map((project) => project.outputDir), allureResults], JSZip);
}
