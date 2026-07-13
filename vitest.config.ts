import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Canvas, Sharp, and SQLite are native modules. Limiting concurrent test
    // workers avoids transient fork exits on smaller GitHub-hosted runners.
    maxWorkers: 2,
    coverage: { reporter: ['text', 'json-summary'] },
  },
});
