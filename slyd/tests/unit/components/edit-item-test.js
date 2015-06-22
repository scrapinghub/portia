import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from 'ember';

moduleForComponent('edit-item', 'EditItemComponent', {
  // specify the other units that are required for this test
   needs: ['component:inline-editable-text-field', 'component:bs-button']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
    item: Ember.Object.create({})
  });
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
