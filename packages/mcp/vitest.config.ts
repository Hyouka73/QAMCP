import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // On Windows, running multiple heavy test files concurrently (each launching
    // real Chromium, SQLite WAL stores, MCP Stdio servers, or PowerShell dialogs)
    // saturates RAM/CPU/I/O and causes intermittent 5s/10s timeouts and swap
    // thrashing. Serializing file execution on Windows eliminates cross-file
    // contention without relaxing global timeouts.
    fileParallelism: process.platform !== 'win32',
    ...(process.platform !== 'win32' ? { maxWorkers: 2 } : {}),
  },
});
