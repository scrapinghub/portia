import Ember from 'ember';
import ToolGroup from './tool-group';

export default ToolGroup.extend({
    annotationStructure: Ember.inject.service(),
    browser: Ember.inject.service(),

    layoutName: 'components/tool-group',

    init() {
        this.set('elementId', 'sample-group');
        this._super();
        Ember.addObserver(this, 'selected', this, this.setMode);
        Ember.addObserver(this, 'selected', this, this.registerAnnotations);
    },

    willDestroyElement() {
        this.get('browser').clearAnnotationMode();
        this.get('annotationStructure').clearDefinition();
    },

    setMode() {
        const browser = this.get('browser');
        if (this.get('selected') === 'data') {
            browser.setAnnotationMode();
        } else {
            browser.clearAnnotationMode();
        }
    },

    registerAnnotations: Ember.observer('sample.orderedAnnotations.[]', function() {
        if (this.get('selected') === 'data') {
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
        } else {
            this.get('annotationStructure').clearDefinition();
        }
    })
});
