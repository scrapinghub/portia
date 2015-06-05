import Ember from 'ember';
import AppVisibilityMixin from '../../../mixins/app-visibility';
import { module, test } from 'qunit';

module('Unit | Mixin | app visibility');

// Replace this with your real tests.
test('it works', function(assert) {
  var AppVisibilityObject = Ember.Object.extend(AppVisibilityMixin);
  var subject = AppVisibilityObject.create();
  assert.ok(subject);
});
