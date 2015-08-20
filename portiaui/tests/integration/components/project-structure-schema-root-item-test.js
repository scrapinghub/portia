import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('project-structure-schema-root-item', 'Integration | Component | project structure schema root item', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{project-structure-schema-root-item}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#project-structure-schema-root-item}}
      template block text
    {{/project-structure-schema-root-item}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
