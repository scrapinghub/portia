
import acceptanceTest from '../helpers/acceptance-test';
import Ember from 'ember';

module('Acceptance | Open Projects', { });

acceptanceTest('Open a project', function(app, assert) {
  return visit('/')
  .then(function(){
    equal(currentURL(), '/projects');
    var projectLinks = find('.clickable-url button');
    equal(projectLinks.length, 2, 'There are two projects');
    return click(projectLinks[0]);
  }).then(function(){
    equal(currentURL(), '/projects/11');
  });
});

