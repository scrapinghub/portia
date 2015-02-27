/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'portia-web',
    environment: environment,
    baseURL: '/',
<<<<<<< HEAD
    EmberENV: {
      FEATURES: {
=======
    SLYD_URL: 'http://33.33.33.51:9001',
    EmberENV: {
      FEATURES: {
        'ember-htmlbars': true,
        'ember-htmlbars-block-params': true,
        'ember-htmlbars-component-generation': true,
        'ember-htmlbars-inline-if-helper': true,
        'ember-htmlbars-attribute-syntax': true,
        'ember-htmlbars-each-with-index': true,
>>>>>>> Port App to Ember-Cli. Start Plugin System. Adds #133 and #136
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {

  }

  return ENV;
};
