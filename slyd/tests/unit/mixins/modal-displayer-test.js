import Ember from 'ember';
import ModalDisplayerMixin from 'portia-web/mixins/modal-displayer';

module('ModalDisplayerMixin');

// Replace this with your real tests.
test('it works', function() {
  var ModalDisplayerObject = Ember.Object.extend(ModalDisplayerMixin);
  var subject = ModalDisplayerObject.create();
  ok(subject);
});
