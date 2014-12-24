module.exports = function(karma) {
    karma.set({
        basePath: "media"

        files: [
          "js/vendor/jquery-1.9.1.js",
          "js/vendor/jquery-ui-1.10.3.js",
          "js/vendor/handlebars-1.0.0.js",
          "js/vendor/ember-debug.js",
          "js/vendor/ember-browser-detect.js",
          "js/vendor/loading.js",
          "js/vendor/ic-ajax.js",
          "js/vendor/uri.js",

          "js/vendor/bs-for-ember/bs-core.max.js",
          "js/vendor/bs-for-ember/bs-badge.max.js",
          "js/vendor/bs-for-ember/bs-breadcrumbs.max.js",
          "js/vendor/bs-for-ember/bs-button.max.js",
          "js/vendor/bs-for-ember/bs-label.max.js",
          "js/vendor/bs-for-ember/bs-modal.max.js",

          "js/jqplugins.js",
          "js/app.js",
          "js/api.js",
          "js/documentview.js",
          "js/canvas.js",
          "js/models.js",
          "js/routes.js",
          "js/emberui.js",
          "js/views.js",
          "js/messages.js",
          "js/controllers/controllers.js",
          "js/controllers/navigation-controller.js",
          "js/controllers/annotation-controller.js",
          "js/controllers/template-controller.js",
          "js/controllers/application-controller.js",
          "js/controllers/items-controller.js",
          "js/controllers/project-controller.js",
          "js/controllers/projects-controller.js",
          "js/controllers/spider-controller.js",

          "js/templates/*.handlebars",

          "tests/fixtures.js",
          "tests/*.js",

          "css/normalize.css",
          "css/jquery-ui-1.10.3.custom.css",
          "css/style.css",
          "css/breadcrumb.css",
        ],

        logLevel: karma.LOG_WARN,

        browsers: ["Chrome", "PhantomJS", "Firefox"],

        // Disable security to avoid XSS errors.
        customLaunchers: {
            Chrome_without_security: {
              base: "Chrome"
              flags: ["--disable-web-security"]
            },
            PhantomJS_without_security: {
              base: "PhantomJS"
              flags: ["--web-security=no"]
            }
        },
        singleRun: true,
        autoWatch: false,

        frameworks: ["qunit"],

        plugins: [
            "karma-qunit",
            "karma-chrome-launcher",
            "karma-firefox-launcher",
            "karma-ember-preprocessor",
            "karma-phantomjs-launcher"
        ],

        preprocessors: {
            "**/*.handlebars": 'ember'
        }
    });
};
