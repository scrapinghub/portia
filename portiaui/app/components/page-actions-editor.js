import Ember from 'ember';

const TYPES = ['click', 'set', 'wait'];

export default Ember.Component.extend({
    actionTypes: TYPES,
    pageActions: null,
    editing: null,
    addingNew: false,

    actions: {
        reorderPageAction: function(originalIndex, newIndex){
            var pageActions = this.get('pageActions');
            var action = pageActions[originalIndex];
            pageActions.removeAt(originalIndex);
            pageActions.insertAt(newIndex, action);
        },
        deletePageAction: function(index){
            var pageActions = this.get('pageActions');
            pageActions.removeAt(index);
        },
        editPageAction: function(pageAction) {
            pageAction._edited = true;
            this.set('editing', pageAction);
        },
        back: function() {
            this.set('editing', null);
        },
        addContinue: function(){
            this.set('addingNew', false);
        },
        addNew: function() {
            var pa = Ember.Object.create({
                type: "wait",
                _edited: true
            });
            this.set('addingNew', true);
            this.set('editing', pa);
            this.get('pageActions').pushObject(pa);
        }
    },
});

