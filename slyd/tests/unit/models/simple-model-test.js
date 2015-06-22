import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('model:simple-model', 'SimpleModel', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists', function() {
  var model = this.subject();
  // var store = this.store();
  ok(!!model);
});
