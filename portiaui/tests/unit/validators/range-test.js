import validateRange from '../../../validators/range';
import { module, test } from 'qunit';

module('Unit | Validators | validateRange');

test('it tests valid ranges', function(assert) {
    const key = 'value';
    const validator = validateRange();

    assert.equal(validator(key, '1-4'), true);
    assert.equal(validator(key, 'a-c'), true);
    assert.equal(validator(key, '5-5'), true);
    assert.equal(validator(key, 'z-z'), true);
});

test('it tests all digits or all letters', function(assert) {
    const error = 'A range must not mix numbers and letters.';

    const key = 'value';
    const validator = validateRange();

    assert.equal(validator(key, '1-a'), error);
    assert.equal(validator(key, 'w-3'), error);
});

test('it tests completeness', function(assert) {
    const error = 'A range must have both a start and an end.';

    const key = 'value';
    const validator = validateRange();

    assert.equal(validator(key, '-1'), error);
    assert.equal(validator(key, '1-'), error);
    assert.equal(validator(key, '-'), error);
    assert.equal(validator(key, ''), error);
});

test('it tests completeness', function(assert) {
    const error = 'A range must be increasing.';

    const key = 'value';
    const validator = validateRange();

    assert.equal(validator(key, '10-5'), `${error} Try swapping to 5-10.`);
    assert.equal(validator(key, 'b-a'), `${error} Try swapping to a-b.`);
});

test('it disallows multiple letters', function(assert) {
    const error = 'A range must have only single letters.';

    const key = 'value';
    const validator = validateRange();

    assert.equal(validator(key, 'a-bc'), error);
    assert.equal(validator(key, 'asd-z'), error);
    assert.equal(validator(key, 'aas-zie'), error);
});

test('it disallows mixed cases', function(assert) {
    const error = 'A range cannot mix lower and upper case.';

    const key = 'value';
    const validator = validateRange();

    assert.equal(validator(key, 'a-C'), error);
    assert.equal(validator(key, 'D-q'), error);
});
