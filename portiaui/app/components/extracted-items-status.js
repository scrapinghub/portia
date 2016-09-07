import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    extractedItems: Ember.inject.service(),

    type: Ember.computed.readOnly('extractedItems.type'),
    changes: Ember.computed('extractedItems.changes', function() {
        return this.get('extractedItems.changes') || [];
    }),

    hasChanges: Ember.computed.gt('changes.length', 0),

    hasWarning: Ember.computed('type', 'changes', 'changes.length', function() {
        let hasChanges = this.get('hasChanges');
        if (this.get('type') === 'js') {
            if (hasChanges && this.get('changes')[0] === 'no_items') {
                return false;
            } else {
                return true;
            }
        }
        return hasChanges;
    }),

    icon: Ember.computed('hasWarning', function() {
        return this.get('hasWarning') ? 'warning-triangle' : 'ok';
    }),
});
