import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('json-file-compare', 'JsonFileCompareComponent', {
});

test('it renders', function() {
  // creates the component instance

  var component = this.subject({
    json: {foo: 5, bar:'foo'},
  });
  equal(component._state, 'preRender');
  this.render();
  equal(component._state, 'inDOM');
});

