import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('extracted-item', 'ExtractedItemComponent', {
  // specify the other units that are required for this test
   needs: ['helper:trim']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
    url: 'http://test.com',
    fields: []
  });
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
