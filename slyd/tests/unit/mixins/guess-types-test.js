import Ember from 'ember';
import GuessTypesMixin from '../../../mixins/guess-types';

module('Unit | Mixin | guess types');

// Replace this with your real tests.
test('it works', function(assert) {
  var GuessTypesObject = Ember.Object.extend(GuessTypesMixin);
  var subject = GuessTypesObject.create();
  assert.ok(subject);
});
