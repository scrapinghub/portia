import Ember from 'ember';
import ActiveChildrenMixin from '../mixins/active-children';
import InstanceCachedObjectProxy from '../utils/instance-cached-object-proxy';
import ItemAnnotationModel from '../models/item-annotation';
import {computedIsCurrentModelById} from '../services/ui-state';


const RootItem = InstanceCachedObjectProxy.extend(ActiveChildrenMixin, {
    itemComponentName: 'data-structure-root-item',

    children: Ember.computed.map('annotations', function(annotation) {
        const itemClass = wrapperForAnnotationModel(annotation);
        return itemClass.create({
            content: annotation,
            container: this.get('container')
        });
    }),
    key: Ember.computed('id', function() {
        const id = this.get('id');
        return `item:${id}`;
    })
});

const RootItemList = Ember.Object.extend(ActiveChildrenMixin, {
    itemComponentName: 'data-structure-root',
    key: 'root',

    children: Ember.computed.map('sample.items', function(item) {
        return RootItem.create({
            content: item,
            container: this.get('container')
        });
    }),
    sample: Ember.computed.readOnly('toolPanel.sample')
});

const Annotation = InstanceCachedObjectProxy.extend({
    uiState: Ember.inject.service(),

    itemComponentName: 'data-structure-annotation-item',

    active: Ember.computed.readOnly('isCurrentAnnotation'),
    isCurrentAnnotation: computedIsCurrentModelById('annotation'),
    key: Ember.computed('id', 'parent.id', function() {
        const id = this.get('id');
        const parentId = this.get('parent.id');
        return `item:${parentId}:annotation:${id}`;
    })
});

const ItemAnnotation = RootItem.extend({
    itemComponentName: 'data-structure-item-annotation-item',

    annotations: Ember.computed.readOnly('item.annotations'),
    key: Ember.computed('id', 'parent.id', function() {
        const id = this.get('id');
        const parentId = this.get('parent.id');
        return `item:${parentId}:item-annotation:${id}`;
    })
});

function wrapperForAnnotationModel(model) {
    return model instanceof ItemAnnotationModel ? ItemAnnotation : Annotation;
}

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
    uiState: Ember.inject.service(),

    tagName: '',

    annotationTree: null,

    init() {
        this._super();
        this.annotationTree = [
            RootItemList.create({
                toolPanel: this,
                container: this.get('container')
            })
        ];
    },

    willDestroyElement() {
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
    }
});
DataStructurePanel.reopenClass({
    overlays: new Map()
});

export default DataStructurePanel;
