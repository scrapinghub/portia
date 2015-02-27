import Ember from 'ember';
import PopoverMixin from 'portia-web/mixins/popover';

module('PopoverMixin');

// Replace this with your real tests.
test('it works', function() {
  var PopoverObject = Ember.Object.extend(PopoverMixin);
  var subject = PopoverObject.create();
  ok(subject);
});
