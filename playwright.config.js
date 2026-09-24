module.exports = {
  testDir: './tests',
  timeout: 30000,
  use: {
    channel: 'chrome',
    headless: true,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
};
