module.exports = function(karma) {
    karma.set({
        basePath: 'media',

        files: [
          "js/vendor/jquery-1.9.1.js",
          "js/vendor/jquery-ui-1.10.3.js",
          "js/vendor/uri.js",
          "js/vendor/handlebars-1.0.0.js",
          "js/vendor/ember-debug.js",
          "js/vendor/ic-ajax.js",
          "js/vendor/ember-data.js",
          "js/vendor/loading.js",
          
          "js/app.js",
          "js/api.js",
          "js/canvas.js",
          "js/controllers.js",
          "js/emberui.js",
          "js/jqplugins.js",
          "js/models.js",
          "js/routes.js",
          "js/selector.js",
          "js/views.js",
          "js/templates/*.handlebars",

          "tests/fixtures.js",
          "tests/*.js",

          "css/normalize.css",
          "http://code.jquery.com/ui/1.10.3/themes/cupertino/jquery-ui.css",
          "css/style.css",
        ],

        logLevel: karma.LOG_WARN,

        browsers: ['Chrome', 'Firefox', 'PhantomJS'],

        // Disable security to avoid XSS errors.
        customLaunchers: {
            Chrome_without_security: {
              base: 'Chrome',
              flags: ['--disable-web-security']
            },
            PhantomJS_without_security: {
              base: 'PhantomJS',
              flags: ['--web-security=no']
            }
        },
        singleRun: true,
        autoWatch: false,

        frameworks: ["qunit"],

        plugins: [
            'karma-qunit',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-ember-preprocessor',
            'karma-phantomjs-launcher'
        ],

        preprocessors: {
            "**/*.handlebars": 'ember'
        }
    });
};
