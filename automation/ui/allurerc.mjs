import { defineConfig } from 'allure';

export default defineConfig({
  name: 'InvenTree UI Tests',
  output: './allure-report',
  // Earlier runs, read and appended on each generate; CI restores it from the Actions cache.
  historyPath: './allure-history/history.jsonl',
  historyLimit: 20,
  // One self-contained index.html, so the report also opens from disk (file://), for example from a CI artifact.
  plugins: { awesome: { options: { singleFile: true } } },
});
