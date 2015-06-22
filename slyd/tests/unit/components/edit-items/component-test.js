import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';

moduleForComponent('edit-items', 'Unit | Component | edit items', {
  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
});

test('it renders', function() {
  expect(2);

  // Creates the component instance
  var component = this.subject({
    item: Ember.Object.create({})
  });
  equal(component._state, 'preRender');

  // Renders the component to the page
  this.render();
  equal(component._state, 'inDOM');
});
