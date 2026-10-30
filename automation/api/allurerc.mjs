import { defineConfig } from 'allure';

export default defineConfig({
  name: 'InvenTree API Tests',
  output: './allure-report',
  // One self-contained index.html, so the report also opens from disk (file://), for example from a CI artifact.
  plugins: { awesome: { options: { singleFile: true } } },
});
