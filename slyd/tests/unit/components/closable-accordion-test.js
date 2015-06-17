import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from 'ember';

moduleForComponent('closable-accordion', 'ClosableAccordionComponent', {
  // specify the other units that are required for this test
     needs: ['component:accordion-item']
});

test('it renders', function() {

  Ember.IdxConfig = {
    getConfig: function(configName){
      equal(configName, 'bs');
    }
  };
  // creates the component instance
  var component = this.subject({
    template: Ember.Handlebars.compile(`
      {{#accordion-item title="item1"}}
      {{/accordion-item}}
      {{#accordion-item title="item2"}}
      {{/accordion-item}}
    `)
  });

  component.set('configName', 'bs');

  equal('number', typeof component.get('selected-idx'));
  equal(0, component.get('selected-idx'));

  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
