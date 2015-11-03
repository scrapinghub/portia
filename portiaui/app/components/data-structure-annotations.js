import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    item: null,
    sample: null,

    activeModels: Ember.computed.readOnly('uiState.models'),
    childActive: Ember.computed(
        'activeModels.annotation', 'activeModels.item', 'item.orderedChildren', function() {
            const activeItemId = this.get('activeModels.item.id');
            const activeAnnotationId = this.get('activeModels.annotation.id');
            if (!activeItemId && !activeAnnotationId) {
                return false;
            }
            return (this.get('item.orderedChildren') || []).any(annotation => {
                if (annotation.constructor.modelName === 'annotation') {
                    return annotation.get('id') === activeAnnotationId;
                } else if (annotation.constructor.modelName === 'item-annotation') {
                    return annotation.get('item.id') === activeItemId;
                }
            });
        }),

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
