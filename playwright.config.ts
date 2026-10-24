import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e', timeout: 30000,
  webServer: { command: 'npm run build && npx vite preview --port 4173', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120000 },
  use: { baseURL: 'http://localhost:4173' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } }],
});
