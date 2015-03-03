import Ember from 'ember';
import DraggableMixin from 'portia-web/mixins/draggable';

module('DraggableMixin');

// Replace this with your real tests.
test('it works', function() {
  var DraggableObject = Ember.Object.extend(DraggableMixin);
  var subject = DraggableObject.create();
  ok(subject);
});
