import Ember from 'ember';

export default Ember.Route.extend({
    uiState: Ember.inject.service(),
    selectedElement: Ember.computed.alias('uiState.viewPort.selectedElement'),
    selectedModel: Ember.computed.alias('uiState.viewPort.selectedModel'),

    model(params) {
        return this.store.peekRecord('annotation', params.annotation_id);
    },

    afterModel(model) {
        if (this.get('selectedModel') !== model) {
            this.setProperties({
                selectedElement: null,
                selectedModel: model
            });
        }
    },

    deactivate() {
        this.setProperties({
            selectedElement: null,
            selectedModel: null
        });
    },

    actions: {
        error() {
            this.transitionTo('projects.project.spider.sample.data');
        }
    }
});
