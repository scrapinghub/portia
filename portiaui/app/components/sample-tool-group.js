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
        this.get('annotationStructure').clearSelectors();
    },

    setMode() {
        const browser = this.get('browser');
        if (this.get('selected') === 'data') {
            browser.setAnnotationMode();
        } else {
            browser.clearAnnotationMode();
        }
    },

    registerAnnotations: Ember.observer('sample.orderedAnnotations.@each.selector', function() {
        if (this.get('selected') === 'data') {
            const selectorStructure = this.get('sample.items').map(item =>
                item.get('annotations').map(function mapper(annotation) {
                    if (annotation.constructor.modelName === 'annotation') {
                        return {
                            model: annotation,
                            selector: annotation.get('selector')
                        };
                    } else if (annotation.constructor.modelName === 'item-annotation') {
                        return (annotation.get('item.annotations') || []).map(mapper);
                    }
                }));
            this.get('annotationStructure').setSelectors(selectorStructure);
        } else {
            this.get('annotationStructure').clearSelectors();
        }
    })
});
