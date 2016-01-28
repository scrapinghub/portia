import Ember from 'ember';
import OptionsRouteMixin from '../../../mixins/options-route';
import { module, test } from 'qunit';

module('Unit | Mixin | options route');

// Replace this with your real tests.
test('it works', function(assert) {
  var OptionsRouteObject = Ember.Object.extend(OptionsRouteMixin);
  var subject = OptionsRouteObject.create();
  assert.ok(subject);
});
