import Ember from 'ember';

const TYPES = ['click', 'set', 'wait', 'scroll'];

export default Ember.Component.extend({
    actionTypes: TYPES,
    pageActions: null,
    editing: null,
    isEditingWait: Ember.computed.equal('editing.type', 'wait'),
    isEditingSet: Ember.computed.equal('editing.type', 'set'),
    isEditingScroll: Ember.computed.equal('editing.type', 'scroll'),
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

