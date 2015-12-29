import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    item: null,
    sample: null,

    actions: {
        enterAnnotation(annotation) {
            this.set('uiState.viewPort.hoveredModels', [annotation]);
        },

        leaveAnnotation() {
            this.set('uiState.viewPort.hoveredModels', []);
        },

        enterItem(item) {
            this.set('uiState.viewPort.hoveredModels', item.get('orderedAnnotations'));
        },

        leaveItem() {
            this.set('uiState.viewPort.hoveredModels', []);
        },

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
