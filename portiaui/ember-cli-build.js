/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
    var app = new EmberApp(defaults, {
        babel: {
            includePolyfill: true
        }
    });

    app.import('bower_components/jquery-color/jquery.color.js');
    app.import('bower_components/uri.js/src/URI.min.js');
    app.import('vendor/tree-mirror.js');

    ['eot', 'svg', 'ttf', 'woff', 'woff2'].forEach(function(file) {
        app.import('bower_components/font-awesome/fonts/fontawesome-webfont.' + file, {
            destDir: 'assets/fonts'
        });
    });

    return app.toTree();
};
