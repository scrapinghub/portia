import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('overlay-icon', 'Integration | Component | overlay icon', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{overlay-icon}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#overlay-icon}}
      template block text
    {{/overlay-icon}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
