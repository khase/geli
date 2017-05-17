// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const {SpecReporter} = require('jasmine-spec-reporter');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './e2e/**/*.e2e-spec.ts'
  ],
  capabilities: {
    'browserName': 'chrome'
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function () {
    }
  },
  plugins: [{
    package: 'protractor-screenshoter-plugin',
    screenshotPath: './.reports/e2e',
    screenshotOnExpect: 'failure+success',
    screenshotOnSpec: 'failure+success',
    imageToAscii: 'failure',
    clearFoldersBeforeTest: true,
    withLogs: false, // We could set this to true => https://www.npmjs.com/package/protractor-screenshoter-plugin#withlogs-chrome-only
    writeReportFreq: 'asap',
    verbose: 'debug'
  }],
  beforeLaunch: function () {
    require('ts-node').register({
      project: 'e2e/tsconfig.e2e.json'
    });
  },
  onPrepare() {
    jasmine.getEnv().addReporter(new SpecReporter({spec: {displayStacktrace: true}}));
  }
};
