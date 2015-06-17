import Ember from 'ember';
import PortiaUtilsMixin from 'portia-web/mixins/application-utils';

module('PortiaUtilsMixin');

// Replace this with your real tests.
test('it works', function() {
  var PortiaUtilsObject = Ember.Object.extend(PortiaUtilsMixin);
  var subject = PortiaUtilsObject.create();
  ok(subject);
});
