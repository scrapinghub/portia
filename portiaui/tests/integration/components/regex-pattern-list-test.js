import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('regex-pattern-list', 'Integration | Component | regex pattern list', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{regex-pattern-list}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#regex-pattern-list}}
      template block text
    {{/regex-pattern-list}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
