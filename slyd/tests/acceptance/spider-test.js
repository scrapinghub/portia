
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

acceptanceTest('Initialization Panel', function(app, assert) {

  function $initPanel(){
    return find('.panel:eq(0)');
  }

  function getStartUrls(){
    return $initPanel().find('.clickable-url button').map((i, elm) => $(elm).text().trim()).toArray();
  }

  visit('/projects/11/spider1').then(function(){
    equal(currentURL(), '/projects/11/spider1');
    equal(find('.nav-container .current-crumb').text().trim(), 'spider1');
    deepEqual(getStartUrls(), ['http://portiatest.com']);
    ok($initPanel().find('button .fa-plus').parent()[0].hasAttribute('disabled'), 'Add urls button should be disabled if textarea is empty');
    return fillIn($initPanel().find('textarea'), '\nhttp://url1.com\n\nhttp://url2.com\n\n');
  }).then(function(){
    ok(!$initPanel().find('button .fa-plus').parent()[0].hasAttribute('disabled'), 'Add urls button should be enabled if user has types urls');
    return click($initPanel().find('button .fa-plus'));
  }).then(function(){
    deepEqual(getStartUrls(), ['http://portiatest.com', 'http://url1.com', 'http://url2.com']);
    equal(lastRequest.url, '/projects/11/spec/spiders/spider1');
    deepEqual(lastRequest.data.start_urls, ['http://portiatest.com', 'http://url1.com', 'http://url2.com']);
    return click($initPanel().find('.btn-danger .fa-trash').eq(1));
  }).then(function(){
    deepEqual(getStartUrls(), ['http://portiatest.com', 'http://url2.com']);
    deepEqual(lastRequest.data.start_urls, ['http://portiatest.com', 'http://url2.com']);
    return click($initPanel().find('.btn-danger .fa-trash').eq(0));
  }).then(function(){
    deepEqual(getStartUrls(), ['http://url2.com']);
    deepEqual(lastRequest.data.start_urls, ['http://url2.com']);
    return click($initPanel().find('button:contains("Edit All")'));
  }).then(function(){
    equal($initPanel().find('textarea').val().trim(), 'http://url2.com');
    return fillIn($initPanel().find('textarea'), '\nhttp://portiatest.com\n\n');
  }).then(function(){
    return click($initPanel().find('button .fa-plus'));
  }).then(function(){
    deepEqual(getStartUrls(), ['http://portiatest.com']);
    deepEqual(lastRequest.data.start_urls, ['http://portiatest.com']);
    return click($initPanel().find('button:contains("Edit All")'));
  }).then(function(){
    equal($initPanel().find('textarea').val().trim(), 'http://portiatest.com');
    return fillIn($initPanel().find('textarea'), 'http://asdasdasdad.com');
  }).then(function(){
    return click($initPanel().find('button:contains("cancel")'));
  }).then(function(){
    deepEqual(getStartUrls(), ['http://portiatest.com']);
    deepEqual(lastRequest.data.start_urls, ['http://portiatest.com']);
  });
});

