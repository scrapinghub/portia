/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var UnwatchedDir = require('ember-cli/node_modules/broccoli-source').UnwatchedDir;
var WatchedDir = require('ember-cli/node_modules/broccoli-source').WatchedDir;
var concat = require('ember-cli/node_modules/broccoli-concat');
var mergeTrees = require('ember-cli/lib/broccoli/merge-trees');

module.exports = function(defaults) {
    var app = new EmberApp(defaults, {
        babel: {
            includePolyfill: true
        }
    });

    app.import('bower_components/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js');
    app.import('bower_components/cookie/cookie.min.js');
    app.import('bower_components/jquery-color/jquery.color.js');
    app.import('bower_components/moment/min/moment.min.js');
    app.import('bower_components/uri.js/src/URI.min.js');
    app.import('bower_components/css-escape/css.escape.js');

    app.import('vendor/tree-mirror.js');
    app.import('vendor/modernizr.js');

    ['eot', 'svg', 'ttf', 'woff', 'woff2'].forEach(function(file) {
        app.import('bower_components/font-awesome/fonts/fontawesome-webfont.' + file, {
            destDir: 'assets/fonts'
        });
    });

    // Splash scripts
    var splashTree = concat(mergeTrees([
        new WatchedDir(app._resolveLocal('../splash_utils')),
        new UnwatchedDir(app._resolveLocal('vendor'))
    ], {
        annotation: 'TreeMerger (splash utils)'
    }), {
        inputFiles: [
            'mutation-summary.js',
            'tree-mirror.js',
            // LocalStorage Shim disabled since it doesn't work in Qt5
            // 'local-storage-shim.js',
            'inject_this.js'
        ],
        outputFile: 'splash_content_scripts/combined.js',
        header: '(function(){',
        footer: '})();'
    });

    return mergeTrees([
        app.toTree(),
        splashTree
    ]);
};
