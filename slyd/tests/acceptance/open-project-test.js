
import acceptanceTest from '../helpers/acceptance-test';
import Ember from 'ember';

module('Acceptance | Open Projects', { });

acceptanceTest('Open a project', function(app, assert) {
  visit('/').then(function(){
    equal(currentURL(), '/projects');
    var projectLinks = find('.clickable-url button');
    equal(projectLinks.length, 2, 'There are two projects');
    equal(projectLinks.eq(0).text().trim(), 'Test Project 1');
    return click(projectLinks[0]);
  }).then(function(){
    equal(currentURL(), '/projects/11');
  });
});

