import Ember from 'ember';
import ActiveChildrenMixin from '../mixins/active-children';
import InstanceCachedObjectProxy from '../utils/instance-cached-object-proxy';
import ItemAnnotationModel from '../models/item-annotation';
import ToolPanel from './tool-panel';
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
    overlayComponentName: 'annotation-overlay'
});

export default ToolPanel.extend({
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    selectorMatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    annotationTree: null,
    overlays: new Map(),
    title: 'Data structure',
    toolId: 'data-structure',

    init() {
        this._super();
        this.annotationTree = [
            RootItemList.create({
                toolPanel: this,
                container: this.get('container')
            })
        ];
    },

    registerSelectors: Ember.observer('sample.orderedAnnotations', function() {
        const browserOverlays = this.get('browserOverlays');
        const selectorMatcher = this.get('selectorMatcher');
        const annotations = new Set(this.getWithDefault('sample.orderedAnnotations', []));
        const lastAnnotations = new Set(this.getWithDefault('_registeredAnnotations', []));

        this.beginPropertyChanges();
        for (let annotation of lastAnnotations) {
            if (!annotations.has(annotation)) {
                selectorMatcher.unregister(annotation);
                const overlay = this.overlays.get(annotation);
                this.overlays.delete(annotation);
                browserOverlays.removeOverlayComponent(overlay);
                overlay.destroy();
            }
        }
        for (let annotation of annotations) {
            if (!lastAnnotations.has(annotation)) {
                selectorMatcher.register(annotation);
                const overlay = AnnotationOverlay.create({
                    content: annotation
                });
                browserOverlays.addOverlayComponent(overlay);
                this.overlays.set(annotation, overlay);
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
    })
});
