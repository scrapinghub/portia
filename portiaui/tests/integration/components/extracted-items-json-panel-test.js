import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('extracted-items-json-panel', 'Integration | Component | extracted items json panel', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{extracted-items-json-panel}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#extracted-items-json-panel}}
      template block text
    {{/extracted-items-json-panel}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
