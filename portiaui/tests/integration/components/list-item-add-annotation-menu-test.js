import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('list-item-add-annotation-menu', 'Integration | Component | list item add annotation menu', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{list-item-add-annotation-menu}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#list-item-add-annotation-menu}}
      template block text
    {{/list-item-add-annotation-menu}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
