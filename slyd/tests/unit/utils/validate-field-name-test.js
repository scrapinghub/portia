import validateFieldName from '../../../utils/validate-field-name';
import { module, test } from 'qunit';

module('Unit | Utility | validate field name');

// Replace this with your real tests.
test('it works', function(assert) {
  var fields = [{name: 'unique'}, {name: 'not_unique'}];
  assert.ok(validateFieldName('_template'));
  assert.ok(validateFieldName('_new_meta_field'));
  assert.ok(validateFieldName('url'));
  assert.ok(validateFieldName('not_unique', fields));
  assert.equal(validateFieldName('new_field', fields), null);
});
