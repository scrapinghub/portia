import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('list-item-schema-manager', 'Integration | Component | list item schema manager', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{list-item-schema-manager}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#list-item-schema-manager}}
      template block text
    {{/list-item-schema-manager}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
