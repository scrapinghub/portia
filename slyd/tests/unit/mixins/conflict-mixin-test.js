import Ember from 'ember';
import ConflictMixinMixin from '../../../mixins/conflict-mixin';
import { module, test } from 'qunit';

module('Unit | Mixin | conflict mixin');

// Replace this with your real tests.
test('it works', function(assert) {
  var ConflictMixinObject = Ember.Object.extend(ConflictMixinMixin);
  var subject = ConflictMixinObject.create();
  assert.ok(subject);
});
