import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('scrapinghub-links', 'Integration | Component | scrapinghub links', {
  integration: true
});

test('it renders', function(assert) {
  
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });" + EOL + EOL +

  this.render(hbs`{{scrapinghub-links}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:" + EOL +
  this.render(hbs`
    {{#scrapinghub-links}}
      template block text
    {{/scrapinghub-links}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
