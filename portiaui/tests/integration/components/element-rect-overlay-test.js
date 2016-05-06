import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('element-rect-overlay', 'Integration | Component | element rect overlay', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{element-rect-overlay}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#element-rect-overlay}}
      template block text
    {{/element-rect-overlay}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
