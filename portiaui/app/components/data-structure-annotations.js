import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    item: null,
    sample: null,

    activeModels: Ember.computed.readOnly('uiState.models'),

    actions: {
        removeAnnotation(annotation) {
            this.get('dispatcher').removeAnnotation(annotation);
        },

        removeItemAnnotation(itemAnnotation) {
            this.get('dispatcher').removeItemAnnotation(itemAnnotation);
        },

        saveItemAnnotation(itemAnnotation) {
            itemAnnotation.save();
        }
    }
});
