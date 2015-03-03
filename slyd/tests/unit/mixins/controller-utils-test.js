import Ember from 'ember';
import ControllerUtilsMixin from 'portia-web/mixins/controller-utils';

module('ControllerUtilsMixin');

// Replace this with your real tests.
test('it works', function() {
  var ControllerUtilsObject = Ember.Object.extend(ControllerUtilsMixin);
  var subject = ControllerUtilsObject.create();
  ok(subject);
});
