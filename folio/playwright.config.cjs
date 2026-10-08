const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/e2e',
  timeout:30000,
  retries:process.env.CI?1:0,
  use:{baseURL:'http://127.0.0.1:4173/folio/',trace:'retain-on-failure'},
  webServer:{command:'node tests/server.cjs',url:'http://127.0.0.1:4173/folio/',reuseExistingServer:!process.env.CI},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
});
