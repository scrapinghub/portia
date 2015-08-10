import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('data-structure-item-annotation-item', 'Integration | Component | data structure item annotation item', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{data-structure-item-annotation-item}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#data-structure-item-annotation-item}}
      template block text
    {{/data-structure-item-annotation-item}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
