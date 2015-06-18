import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from 'ember';

moduleForComponent('copy-spider', 'CopySpiderComponent', {
  // specify the other units that are required for this test
   needs: ['component:check-box']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
    data:{},
    slyd:{
      getProjectNames: function(){
        return new Ember.RSVP.Promise(function(resolve, reject) {
          resolve(['Project 1', 'Project 2']);
        });
      },
      loadItems: function(){
        return new Ember.RSVP.Promise(function(resolve, reject) {
          resolve([]);
        });
      },
      getSpiderNames: function(){
        return new Ember.RSVP.Promise(function(resolve, reject) {
          resolve(['Spider 1', 'Spider 2']);
        });
      }
    }
  });
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
