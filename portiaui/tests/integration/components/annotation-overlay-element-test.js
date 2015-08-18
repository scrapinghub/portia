import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('annotation-overlay-element', 'Integration | Component | annotation overlay element', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{annotation-overlay-element}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#annotation-overlay-element}}
      template block text
    {{/annotation-overlay-element}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
