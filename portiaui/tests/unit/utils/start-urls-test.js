import { multiplicityFragment } from '../../../utils/start-urls';
import { module, test } from 'qunit';

module('Unit | Utility | startUrls');

test('is correct for a one number range', function(assert) {
  const fragment = { type: 'range', value: '0-0' };
  assert.equal(multiplicityFragment(fragment), 1);
});

test('is correct for a large range', function(assert) {
  const fragment = { type: 'range', value: '0-99' };
  assert.equal(multiplicityFragment(fragment), 100);
});

test('is correct for a non-zero starting range', function(assert) {
  const fragment = { type: 'range', value: '51-100' };
  assert.equal(multiplicityFragment(fragment), 50);
});
