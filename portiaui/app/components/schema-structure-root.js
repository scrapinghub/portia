import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    actions: {
        addField() {
            const schema = this.get('uiState.models.schema');
            this.get('dispatcher').addField(schema, undefined, /* redirect = */true);
        }
    }
});
