/* globals requirejs, require */
(function() {
define("ember-cli/test-loader",
  [],
  function() {
    "use strict";

    var TestLoader = function() {
    };

    TestLoader.prototype = {
      shouldLoadModule: function(moduleName) {
        return (moduleName.match(/[-_]test$/));
      },

      loadModules: function() {
        var moduleName;

        for (moduleName in requirejs.entries) {
          if (this.shouldLoadModule(moduleName)) {
            this.require(moduleName);
          }
        }
      }
    };

    TestLoader.prototype.require = function(moduleName) {
      try {
        require(moduleName);
      } catch(e) {
        this.moduleLoadFailure(moduleName, e);
      }
    };

    TestLoader.prototype.moduleLoadFailure = function(moduleName, error) {
      console.error('Error loading: ' + moduleName, error.stack);
    };

    TestLoader.load = function() {
      new TestLoader().loadModules();
    };

    return {
      'default': TestLoader
    }
  }
);
})();
