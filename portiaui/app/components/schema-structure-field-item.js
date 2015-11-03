import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    cannotDeleteField: Ember.computed.gt('field.annotations.length', 0),
    field: Ember.computed.readOnly('item.content'),

    actions: {
        removeField() {
            const field = this.get('field');
            this.get('dispatcher').removeField(field);
        },

        saveField() {
            const field = this.get('field');
            field.save();
        }
    }
});
