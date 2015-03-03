import Ember from 'ember';
import PortiaApplicationMixin from 'portia-web/mixins/portia-application';

module('PortiaApplicationMixin');

// Replace this with your real tests.
test('it works', function() {
  var PortiaApplicationObject = Ember.Object.extend(PortiaApplicationMixin);
  var subject = PortiaApplicationObject.create();
  ok(subject);
});
