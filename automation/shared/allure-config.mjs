// Allure 3 settings shared by automation/api and automation/ui; plain values only, because shared/ has no node_modules.

/** The common Allure config; each project wraps it in its own `defineConfig` with its report name. */
export function allureConfig(name) {
  return {
    name,
    output: './allure-report',
    // Earlier runs, read and appended on each generate; CI restores it from the Actions cache.
    historyPath: './allure-history/history.jsonl',
    historyLimit: 20,
    // One self-contained index.html, so the report also opens from disk (file://), for example from a CI artifact.
    plugins: { awesome: { options: { singleFile: true } } },
  };
}
