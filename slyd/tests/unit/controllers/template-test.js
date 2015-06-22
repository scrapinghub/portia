import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('controller:template', 'TemplateController', {
  // Specify the other units that are required for this test.
   needs: ['controller:application', 'controller:projects', 'controller:project', 'controller:spider', 'controller:spider/index']
});

// Replace this with your real tests.
test('it exists', function() {
  var controller = this.subject();
  ok(controller);
});
