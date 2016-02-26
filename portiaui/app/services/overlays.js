import Ember from 'ember';

export default Ember.Service.extend({
    counter: 0,

    hasOverlays: Ember.computed.bool('counter'),

    add() {
        this.incrementProperty('counter');
    },

    remove() {
        this.decrementProperty('counter');
    }
});
