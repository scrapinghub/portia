/*!
 * ic-ajax
 *
 * - (c) 2013 Instructure, Inc
 * - please see license at https://github.com/instructure/ic-ajax/blob/master/LICENSE
 * - inspired by discourse ajax: https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['ember'], function(Ember) { return factory(Ember); });
  } else if (typeof exports === 'object') {
    module.exports = factory(require('ember'));
  } else {
    root.ic = root.ic || {};
    root.ic.ajax = factory(Ember);
  }
}(this, function(Ember) {

  /*
   * jQuery.ajax wrapper, supports the same signature except providing
   * `success` and `error` handlers will throw an error (use promises instead)
   * and it resolves only the response (no access to jqXHR or textStatus).
   */

  var ajax = function() {
    return ajax.raw.apply(null, arguments).then(function(result) {
      return result.response;
    });
  };

  /*
   * Same as `ajax` except it resolves an object with `{response, textStatus,
   * jqXHR}`, useful if you need access to the jqXHR object for headers, etc.
   */

  ajax.raw = function() {
    return makePromise(parseArgs.apply(null, arguments));
  };

  /*
   * Defines a fixture that will be used instead of an actual ajax
   * request to a given url. This is useful for testing, allowing you to
   * stub out responses your application will send without requiring
   * libraries like sinon or mockjax, etc.
   *
   * For example:
   *
   *    ajax.defineFixture('/self', {
   *      response: { firstName: 'Ryan', lastName: 'Florence' },
   *      textStatus: 'success'
   *      jqXHR: {}
   *    });
   *
   * @param {String} url
   * @param {String} method
   * @param {Object} fixture
   */
  ajax.defineFixture = function(url, method, fixture) {
    ajax.FIXTURES = ajax.FIXTURES || {};
    ajax.FIXTURES[method + '_' + url] = {data: fixture, callCount: 0};
  };

  /*
   * Looks up a fixture by url and HTTP method.
   *
   * @param {String} url
   * @param {String} method
   */
  ajax.lookupFixture = function(url, method) {
    var fixture = ajax.FIXTURES && ajax.FIXTURES[method + '_' + url];
    if (fixture) {
      fixture.callCount += 1;
      return fixture.data;
    };
  };

  /*
   * Looks up how many times a fixture has been called by url and HTTP method.
   *
   * @param {String} url
   * @param {String} method
   */
  ajax.callCount = function(url, method) {
    var fixture = ajax.FIXTURES && ajax.FIXTURES[method + '_' + url];
    if (fixture) {
      return fixture.callCount;
    };
    return -1;
  }

  function makePromise(settings) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      var fixture = ajax.lookupFixture(settings.url, settings.type);
      if (fixture) {
        return resolve(fixture);
      }
      settings.success = makeSuccess(resolve, reject);
      settings.error = makeError(resolve, reject);
      Ember.$.ajax(settings);
    });
  };

  function parseArgs() {
    var settings = {};
    if (arguments.length === 1) {
      if (typeof arguments[0] === "string") {
        settings.url = arguments[0];
      } else {
        settings = arguments[0];
      }
    } else if (arguments.length === 2) {
      settings = arguments[1];
      settings.url = arguments[0];
    }
    if (settings.success || settings.error) {
      throw new Error("ajax should use promises, received 'success' or 'error' callback");
    }
    return settings;
  }

  function makeSuccess(resolve, reject) {
    return function(response, textStatus, jqXHR) {
      Ember.run(null, resolve, {
        response: response,
        textStatus: textStatus,
        jqXHR: jqXHR
      });
    }
  }

  function makeError(resolve, reject) {
    return function(jqXHR, textStatus, errorThrown) {
      Ember.run(null, reject, {
        jqXHR: jqXHR,
        textStatus: textStatus,
        errorThrown: errorThrown
      });
    };
  }

  return ajax;

}));
