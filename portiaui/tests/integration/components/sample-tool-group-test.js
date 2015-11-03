import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('sample-tool-group', 'Integration | Component | sample tool group', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{sample-tool-group}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#sample-tool-group}}
      template block text
    {{/sample-tool-group}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
