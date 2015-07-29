import {
  moduleForComponent,
  test
} from 'ember-qunit';
import FerryWebsocket from 'portia-web/utils/ferry-websocket';

moduleForComponent('web-document-js', 'WebDocumentJsComponent', {
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var doc = {},
      component = this.subject({
      document: doc,
      ws: new FerryWebsocket()
  });
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
