
import acceptanceTest from '../helpers/acceptance-test';
import Ember from 'ember';
import { lastRequest } from '../helpers/fixtures';

module('Acceptance | Spider', { });

acceptanceTest('List spiders', function(app, assert) {
  function getSpiders() {
    return find('.clickable-url button').map((i, elm) => $(elm).text().trim()).toArray();
  }

  visit('/projects/11').then(function(){
    equal(currentURL(), '/projects/11');
    equal(find('.nav-container .current-crumb').text().trim(), 'Test Project 1');

    var spiderLinks = find('.clickable-url button');
    equal(spiderLinks.length, 2, 'There are two spiders');
    deepEqual(getSpiders(), ['spider1', 'spider2']);
    return fillIn('#toolbox .ember-text-field', 'pider1');
  }).then(function(){
    deepEqual(getSpiders(), ['spider1']);
    return fillIn('#toolbox .ember-text-field', 'ider2');
  }).then(function(){
    deepEqual(getSpiders(), ['spider2']);
    return fillIn('#toolbox .ember-text-field', 'spider');
  }).then(function(){
    deepEqual(getSpiders(), ['spider1', 'spider2']);
    return fillIn('#toolbox .ember-text-field', 'testtesttest');
  }).then(function(){
    deepEqual(getSpiders(), []);
    return fillIn('#toolbox .ember-text-field', '');
  }).then(function(){
    return click(find('button.btn-danger .fa-trash'));
  }).then(function(){
    equal(find('.modal-body').length, 1);
    ok(/Are you sure/.test(find('.modal-body').text()));
    return click(find('.modal-footer .btn-danger'));
  }).then(function(){
    equal(lastRequest.data.cmd, 'rm');
    deepEqual(lastRequest.data.args, ['spider1']);
    deepEqual(getSpiders(), ['spider2']);
  });
});


