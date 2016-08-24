import Ember from 'ember';
import SaveSpiderMixinMixin from 'portia-ui/mixins/save-spider-mixin';
import { module, test } from 'qunit';

module('Unit | Mixin | save spider mixin');

// Replace this with your real tests.
test('it works', function(assert) {
  let SaveSpiderMixinObject = Ember.Object.extend(SaveSpiderMixinMixin);
  let subject = SaveSpiderMixinObject.create();
  assert.ok(subject);
});
