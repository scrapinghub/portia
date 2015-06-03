/* global require, module */
var mergeTrees = require('broccoli-merge-trees');
var pickFiles = require('broccoli-static-compiler');
var concat = require('broccoli-concat');
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
    vendorFiles: {
        'handlebars.js': null
    }
});

// Use `app.import` to add additional libraries to the generated
// output files.
//
// If you need to use different assets in different
// environments, specify an object as the first parameter. That
// object's keys should be the environment name and the values
// should be the asset to use in that environment.
//
// If the library that you are including contains AMD or ES6
// modules that you would like to import into your application
// please specify an object with the list of modules as keys
// along with the exports of each module as its value.

app.import('vendor/mutation-summary.js');
app.import('vendor/tree-mirror.js');
app.import('bower_components/ic-ajax/dist/named-amd/main.js');
app.import('bower_components/canvasloader/js/heartcode-canvasloader-min.js');
app.import('vendor/uri.js');
app.import('vendor/bootstrap.min.js');
app.import('vendor/jquery.binarytransport.js');

app.import('bower_components/bootstrap/dist/css/bootstrap.min.css');
app.import('bower_components/bootstrap/dist/css/bootstrap-theme.min.css');
app.import('bower_components/normalize.css/normalize.css');
app.import('app/styles/jquery-ui-1.10.3.custom.css');
app.import('bower_components/fontawesome/css/font-awesome.min.css');

var fontTree = pickFiles('bower_components/fontawesome/fonts', {
    srcDir: '/',
    files: ['fontawesome-webfont.eot','fontawesome-webfont.ttf','fontawesome-webfont.svg','fontawesome-webfont.woff', 'fontawesome-webfont.woff2'],
    destDir: '/assets/fonts'
});

var publicFiles = pickFiles('public', {
    srcDir: '/',
    destDir: '/',
});

var injectFiles = concat('splash_utils/', {
    inputFiles: [
        '../node_modules/es5-shim/es5-shim.js',
        '../node_modules/mutationobserver-shim/MutationObserver.js',
        '../vendor/mutation-summary.js',
        '../vendor/tree-mirror.js',
        'inject_this.js'
    ],
    outputFile: '/splash_content_scripts/combined.js',
    wrapInFunction: false,
    header: '(function(){',
    footer: '})();'
});

minifyJS: {
    enabled: false
}

module.exports = mergeTrees([app.toTree(), fontTree, publicFiles, injectFiles], {overwrite: true});
