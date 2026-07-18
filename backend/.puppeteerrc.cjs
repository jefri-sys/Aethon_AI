const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a location that is persisted in Render deployments
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
