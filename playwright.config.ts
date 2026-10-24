import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e', timeout: 30000, workers: 2,
  webServer: { command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 120000 },
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
