/* global require, module */
var mergeTrees = require('broccoli-merge-trees');
var concat = require('broccoli-concat');
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({});
minifyJS: {
    enabled: false
}
var injectFiles = concat('./', {
    inputFiles: [
        'node_modules/es5-shim/es5-shim.js',
        'node_modules/mutationobserver-shim/MutationObserver.js',
        'vendor/mutation-summary.js',
        'vendor/tree-mirror.js',
        'splash_utils/inject_this.js'
    ],
    outputFile: '/splash_content_scripts/combined.js',
    wrapInFunction: false,
    header: '(function(){',
    footer: '})();'
});
module.exports = app.toTree(injectFiles)
