import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    item: null,
    sample: null,
    annotationColors: [],

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

        removeItem(item) {
            this.get('dispatcher').removeItem(item);
        },

        saveItem(item) {
            item.save();
        }
    }
});
