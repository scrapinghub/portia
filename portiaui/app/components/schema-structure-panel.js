import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    activeModels: Ember.computed.readOnly('uiState.models'),

    actions: {
        addField(schema) {
            this.get('dispatcher').addField(schema, undefined, /* redirect = */true);
        },

        removeField(field) {
            this.get('dispatcher').removeField(field);
        },

        saveField(field) {
            field.save();
        }
    }
});
