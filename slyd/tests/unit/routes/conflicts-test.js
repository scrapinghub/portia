import {
  moduleFor,
  test
} from 'ember-qunit';
import Ember from 'ember';

moduleFor('route:conflicts', 'ConflictsRoute', {
  // Specify the other units that are required for this test.
   needs: ['controller:conflicts', 'template:conflicts.resolver']
});

function conflict(base, my, other) {
    return {
        __CONFLICT: {
            base_val: base,
            my_val: my,
            other_val: other
        }
    };
}

var struct = {
    foo: {
        bar: {
            num: 1,
            str: 'hello',
            arr: ['world']
        }
    },
    conflicting_str: conflict('foo', 'foobar', 'barfoo'),
    conflicting_num: conflict(1337, 42, 314)
};

var routeMocks = {
  router: {
    namespace: {},
    router: {
      state: {}
    }
  },
  connections: []
};

function render(route, controller){
  Ember.run(function(){
    try{
      route.render('conflicts/resolver', {
          into: 'application',
          outlet: 'conflictResolver',
          controller: controller,
      });
    }catch(e){
      throw new Error(e.stack);
    }
  });
}

test('it exists', function() {
  var route = this.subject(routeMocks);
  ok(route);

  var controller = route.controllerFor('conflicts');
  controller.reopen({
    currentFileContents: struct,
  });
  render(route, controller);
});

