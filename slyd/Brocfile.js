/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
    fingerprint: {
        exclude: ['scrapinghub-logo.png']
    }
});

module.exports = app.toTree();
