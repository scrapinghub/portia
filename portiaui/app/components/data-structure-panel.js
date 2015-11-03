import Ember from 'ember';

export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    selected: false,

    activeModels: Ember.computed.readOnly('uiState.models'),

    updateHoverOverlayColor: Ember.observer(
        'selected', 'sample.annotationColors.length', function() {
            if (this.get('selected')) {
                this.set('browserOverlays.hoverOverlayColor',
                    this.get('sample.annotationColors.lastObject'));
            }
        }),

    actions: {
        addItem(sample) {
            this.get('dispatcher').addItem(sample, /* redirect = */true);
        },

        removeItem(item) {
            this.get('dispatcher').removeItem(item);
        }
    }
});
