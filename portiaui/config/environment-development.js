/* jshint node: true */

module.exports = function(ENV) {
    ENV.APP.LOG_ACTIVE_GENERATION = true;
    ENV.APP.LOG_TRANSITIONS = true;
    ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.LOG_VIEW_LOOKUPS = true;
    //ENV.APP.LOG_RESOLVER = true;
    return ENV;
};