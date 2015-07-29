import {
  moduleForComponent,
  test
} from 'ember-qunit';

import SpriteStore from 'portia-web/utils/sprite-store';

moduleForComponent('annotations-plugin', 'AnnotationsPluginComponent', {
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
      data: {},
      alldata: [],
      item: {},
      createField: "createField",
      close: "hideFloatingAnnotationWidget",
      edit: "editAnnotation",
      document: {
        iframe: $(),
        view: {
          getIframe: function() {return $();}
        }
      },
      pluginState: {},
      sprites: new SpriteStore(),
      extractionFieldTypes: {},
      updatePluginData: "updatePluginField"
  });
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
