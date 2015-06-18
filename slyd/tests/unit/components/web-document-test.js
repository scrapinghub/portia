import {
  moduleForComponent,
  test
} from 'ember-qunit';
import { initialize } from '../../../initializers/register-page-interaction';
import Ember from 'ember';

var application, container;

moduleForComponent('web-document', 'WebDocumentComponent', {
  // specify the other units that are required for this test
  needs: ['initializer:register-page-interaction'],

});

test('it renders', function() {
  expect(3);

  var doc = {};
  // creates the component instance
  var component = this.subject({
      document: doc
  });
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
  equal(doc.view, component, 'Component registers itself');
});
