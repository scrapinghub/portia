import startUrl from '../../../models/start-url';
import { moduleForModel, test } from 'ember-qunit';

moduleForModel('start-url', 'Unit | Model | start-url', {
  needs: []
});

test('it generates a correct url list', function(assert) {
  const urlString = 'http://domain.com';
  const url = startUrl({ isGenerated: true, url: urlString});

  assert.deepEqual(url.generateList(), [[urlString]]);
});

test('it generates a list with a list fragment', function(assert) {
  const urlString = 'http://domain.com';
  const url = startUrl({ isGenerated: true, url: urlString});
  url.fragments.addObject({type: 'list', value: 'a,b'});
  const result = [
      [urlString, 'a'],
      [urlString, 'b']
  ];

  assert.deepEqual(url.generateList(), result);
});

test('it generates a list with a range fragment', function(assert) {
  const urlString = 'http://domain.com';
  const url = startUrl({ isGenerated: true, url: urlString});
  url.fragments.addObject({type: 'range', value: '0-2'});
  const result = [
      [urlString, '0'],
      [urlString, '1'],
      [urlString, '2']
  ];

  assert.deepEqual(url.generateList(), result);
});

test('it generates a combined fragment correctly', function(assert) {
  const urlString = 'http://domain.com';
  const url = startUrl({ isGenerated: true, url: urlString});
  url.fragments.addObject({type: 'list', value: 'a,b'});
  url.fragments.addObject({type: 'range', value: '0-1'});
  url.fragments.addObject({type: 'fixed', value: '/ending'});
  const result = [
      [urlString, 'a', '0', '/ending'],
      [urlString, 'a', '1', '/ending'],
      [urlString, 'b', '0', '/ending'],
      [urlString, 'b', '1', '/ending']
  ];

  assert.deepEqual(url.generateList(), result);
});

test('it treats ranges nicely', function(assert) {
  const urlString = 'http://domain.com';
  const url = startUrl({ isGenerated: true, url: urlString});
  url.fragments.addObject({type: 'range', value: '0-'});
  const result = [ [urlString, ''] ];

  assert.deepEqual(url.generateList(), result);
});
