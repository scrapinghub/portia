import Ember from 'ember';

const AnnotationOverlay = Ember.ObjectProxy.extend({
    selectorMatcher: Ember.inject.service(),

    overlayComponentName: 'annotation-overlay',

    init() {
        this._super();
        this.currentSelector = null;
        this.registerSelectorMatcher();
    },

    registerSelectorMatcher: Ember.observer('selector', function() {
        const selectorMatcher = this.get('selectorMatcher');
        const selector = this.get('selector');
        if (this.currentSelector) {
            selectorMatcher.unRegister(this.currentSelector, this, this.updateElements);
        }
        if (selector) {
            selectorMatcher.register(selector, this, this.updateElements);
            this.currentSelector = selector;
        }
    }),

    willDestroy() {
        this._super();
        const selectorMatcher = this.get('selectorMatcher');
        selectorMatcher.unRegister(this.currentSelector, this, this.updateElements);
    },

    updateElements(elements) {
        this.set('elements', elements);
    }
});

const DataStructurePanel = Ember.Component.extend({
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    dataStructure: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    selected: false,

    activeModels: Ember.computed.readOnly('uiState.models'),

    init() {
        this._super();
        //this.set('doNotRender', false);
    },

    willDestroyElement() {
        //this.set('doNotRender', true);
        const lastAnnotations = new Set(this.getWithDefault('_registeredAnnotations', []));

        this.beginPropertyChanges();
        for (let annotation of lastAnnotations) {
            this.removeAnnotation(annotation);
        }
        this.set('_registeredAnnotations', []);
        this.get('browser').clearAnnotationMode();
        this.endPropertyChanges();
    },

    registerAnnotations: Ember.observer('sample.orderedAnnotations', function() {
        const annotations = new Set(this.getWithDefault('sample.orderedAnnotations', []));
        const lastAnnotations = new Set(this.getWithDefault('_registeredAnnotations', []));

        this.beginPropertyChanges();
        for (let annotation of lastAnnotations) {
            if (!annotations.has(annotation)) {
                this.removeAnnotation(annotation);
            }
        }
        for (let annotation of annotations) {
            if (!lastAnnotations.has(annotation)) {
                this.addAnnotation(annotation);
            }
        }
        this.set('_registeredAnnotations', annotations);
        this.endPropertyChanges();
    }),

    updateHoverOverlayColor: Ember.observer(
        'selected', 'sample.annotationColors.length', function() {
            if (this.get('selected')) {
                this.set('browserOverlays.hoverOverlayColor',
                    this.get('sample.annotationColors.lastObject'));
            }
        }),

    setMode: Ember.observer('selected', function() {
        const browser = this.get('browser');
        if (this.get('selected')) {
            browser.setAnnotationMode();
        } else {
            browser.clearAnnotationMode();
        }
    }),

    addAnnotation(annotation) {
        const browserOverlays = this.get('browserOverlays');
        const overlay = AnnotationOverlay.create({
            content: annotation,
            container: this.get('container')
        });
        browserOverlays.addOverlayComponent(overlay);
        DataStructurePanel.overlays.set(annotation, overlay);
    },

    removeAnnotation(annotation) {
        const browserOverlays = this.get('browserOverlays');
        const overlay = DataStructurePanel.overlays.get(annotation);
        DataStructurePanel.overlays.delete(annotation);
        browserOverlays.removeOverlayComponent(overlay);
        overlay.destroy();
    },

    actions: {
        addItem(sample) {
            this.get('dispatcher').addItem(sample, /* redirect = */true);
        },

        removeItem(item) {
            this.get('dispatcher').removeItem(item);
        }
    }
});
DataStructurePanel.reopenClass({
    overlays: new Map()
});

export default DataStructurePanel;
