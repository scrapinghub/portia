import Ember from 'ember';
import SizeListenerMixin from 'portia-web/mixins/size-listener';

module('SizeListenerMixin');

// Replace this with your real tests.
test('it works', function() {
  var SizeListenerObject = Ember.Object.extend(SizeListenerMixin);
  var subject = SizeListenerObject.create();
  ok(subject);
});
