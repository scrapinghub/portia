import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('schema-structure-root', 'Integration | Component | schema structure root', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{schema-structure-root}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#schema-structure-root}}
      template block text
    {{/schema-structure-root}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
