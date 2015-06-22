import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from 'ember';

moduleForComponent('extracted-item', 'ExtractedItemComponent', {
  // specify the other units that are required for this test
   needs: ['helper:trim']
});

test('it renders', function() {
  // Ember 1.11 doesn't seem to load the helper in the tests, but tried with Ember 1.13 and it works
  var ember_gt_113 = !/^1\.1[12]\./.test(Ember.VERSION);
  expect(ember_gt_113 ? 2 : 1);

  // creates the component instance
  var component = this.subject({
    url: 'http://test.com',
    fields: [],
    trim: function(){}
  });
  equal(component._state, 'preRender');

  if(ember_gt_113) {
    // appends the component to the page
    this.append();
    equal(component._state, 'inDOM');
  }

});
