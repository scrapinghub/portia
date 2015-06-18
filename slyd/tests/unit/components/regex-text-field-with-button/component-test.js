import { moduleForComponent, test } from 'ember-qunit';

moduleForComponent('regex-text-field-with-button', 'Unit | Component | regex text field with button', {
  // Specify the other units that are required for this test
   needs: ['component:text-field', 'component:bs-button']
});

test('it renders', function() {
  expect(2);

  // Creates the component instance
  var component = this.subject();
  equal(component._state, 'preRender');

  // Renders the component to the page
  this.render();
  equal(component._state, 'inDOM');
});
