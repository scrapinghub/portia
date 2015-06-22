import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('controller:spider', 'SpiderController', {
  // Specify the other units that are required for this test.
   needs: ['controller:application', 'controller:projects', 'controller:project', 'controller:project/index']
});

// Replace this with your real tests.
test('it exists', function() {
  var controller = this.subject();
  ok(controller);
});
