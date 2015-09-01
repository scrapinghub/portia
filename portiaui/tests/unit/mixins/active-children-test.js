import Ember from 'ember';
import ActiveChildrenMixin from '../../../mixins/active-children';
import { module, test } from 'qunit';

module('Unit | Mixin | active children');

// Replace this with your real tests.
test('it works', function(assert) {
  var ActiveChildrenObject = Ember.Object.extend(ActiveChildrenMixin);
  var subject = ActiveChildrenObject.create();
  assert.ok(subject);
});
