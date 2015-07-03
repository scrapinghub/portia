/* jshint node: true */
'use strict';
var mergeTrees = require('broccoli-merge-trees');
var concat = require('broccoli-concat');
var funnel = require('broccoli-funnel');
var p = require('ember-cli/lib/preprocessors');
var preprocessTemplates = p.preprocessTemplates;

module.exports = {
    name: 'portia-web',
    included: function(app) {
        this._super.included.apply(this, arguments);
        app.import('bower_components/babel-polyfill/browser-polyfill.js');
        app.import('bower_components/ic-ajax/dist/named-amd/main.js');
        app.import('bower_components/canvasloader/js/heartcode-canvasloader-min.js');
        app.import('vendor/uri.js');
        app.import('vendor/bootstrap.min.js');
        app.import('vendor/jquery.binarytransport.js');
        app.import('vendor/mutation-summary.js');
        app.import('vendor/tree-mirror.js');

        if (app.env === 'test') {
            app.import('bower_components/ember/ember-template-compiler.js');
        }

        app.import('bower_components/bootstrap/dist/css/bootstrap.min.css');
        app.import('bower_components/bootstrap/dist/css/bootstrap-theme.min.css');
        app.import('bower_components/normalize.css/normalize.css');
        app.import('app/styles/jquery-ui-1.10.3.custom.css');
        app.import('bower_components/fontawesome/css/font-awesome.min.css');

        ['fontawesome-webfont.eot',
         'fontawesome-webfont.ttf',
         'fontawesome-webfont.svg',
         'fontawesome-webfont.woff',
         'fontawesome-webfont.woff2'].forEach(function(file) {
            app.import('bower_components/fontawesome/fonts/' + file, {
                destDir: 'assets/fonts'
            });
        });
    },
    treeForApp: function(tree) {
        // add compiled pod templates to app tree, since ember doesn't include them in the build
        var app = this.app || this.parent.app,
            podTemplates = funnel(tree, {
            include: app._podTemplatePatterns(),
            exclude: [/^templates/]
        });

        var processedPodTemplates = preprocessTemplates(podTemplates, {
            registry: app.registry
        });

        return mergeTrees([tree, processedPodTemplates]);
    },
    treeForPublic: function(tree) {
        return mergeTrees([funnel(tree, {
            destDir: '/'
        }), concat(this.project.relativeDir || './', {
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
        })]);
    },
    treeForStyles: function(tree) {
        return funnel(tree, {
            destDir: 'app/styles'
        });
    },
    treeGenerator: function(dir) {
        // make sure this is a watched tree
        return dir;
    }
};
