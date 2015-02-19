import Ember from 'ember';
import ModalHandlerMixin from 'portia-web/mixins/modal-handler';

module('ModalHandlerMixin');

// Replace this with your real tests.
test('it works', function() {
  var ModalHandlerObject = Ember.Object.extend(ModalHandlerMixin);
  var subject = ModalHandlerObject.create();
  ok(subject);
});
