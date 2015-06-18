import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('top-bar', 'TopBarComponent', {
  // specify the other units that are required for this test
   needs: ['component:scrapinghub-branding']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
    branding: {
      component: 'scrapinghub-branding',
      data: {}
    }
  });
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
