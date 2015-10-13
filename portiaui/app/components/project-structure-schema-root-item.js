import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    actions: {
        addSchema() {
            const project = this.get('uiState.models.project');
            this.get('dispatcher').addSchema(project, /* redirect = */true);
        }
    }
});
