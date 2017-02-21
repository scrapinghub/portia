import validateWhitespace from '../../../validators/whitespace';
import { module, test } from 'qunit';

module('Unit | Validators | validateWhitespace');

test('it should be true without whitespace', function(assert) {
    const key = 'value';
    const validator = validateWhitespace();

    assert.equal(validator(key, 'withoutspace'), true);
});

test('it should not have whitespace', function(assert) {
    const error = 'Should not have whitespace';
    const key = 'value';
    const validator = validateWhitespace();

    assert.equal(validator(key, 'with space'), error);
    assert.equal(validator(key, 'endspace '), error);
    assert.equal(validator(key, ' startspace'), error);
});
