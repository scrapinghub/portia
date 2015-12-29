import Ember from 'ember';

export default Ember.Component.extend({
    annotationStructure: Ember.inject.service(),
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    init() {
        this._super();
        this.get('browser').setAnnotationMode();
        this.registerAnnotations();
    },

    willDestroyElement() {
        this.get('browser').clearAnnotationMode();
        this.get('annotationStructure').clearDefinition();
    },

    registerAnnotations: Ember.observer('sample.orderedAnnotations.[]', function() {
        const selectorStructure = this.get('sample.items').map(item => ({
            annotation: item,
            children: item.get('annotations').map(function mapper(annotation) {
                if (annotation.constructor.modelName === 'annotation') {
                    return {
                        annotation
                    };
                } else if (annotation.constructor.modelName === 'item-annotation') {
                    return {
                        annotation,
                        children: (annotation.get('item.annotations') || []).map(mapper)
                    };
                }
            })
        }));
        this.get('annotationStructure').setDefinition(selectorStructure);
    }),

    updateHoverOverlayColor: Ember.observer('sample.annotationColors.length', function() {
        this.set('browserOverlays.hoverOverlayColor',
            this.get('sample.annotationColors.lastObject'));
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
