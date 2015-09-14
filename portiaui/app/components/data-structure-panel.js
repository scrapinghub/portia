import Ember from 'ember';
import ActiveChildrenMixin from '../mixins/active-children';
import InstanceCachedObjectProxy from '../utils/instance-cached-object-proxy';
import ItemAnnotationModel from '../models/item-annotation';
import ToolPanel from './tool-panel';
import {computedIsCurrentModelById} from '../services/ui-state';
import {getColors} from '../utils/colors';


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
    }),
    matches: Ember.computed('children.@each.matches', function() {
        return Math.max(0, ...this.get('children')
            .map(child => child.get('children') ? 0 : child.get('matches')));
    }),
    name: Ember.computed.readOnly('schema.name')
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
    childMatches: Ember.computed.mapBy('children', 'matches'),
    matches: Ember.computed.sum('childMatches'),
    sample: Ember.computed.readOnly('toolPanel.sample')
});

const Annotation = InstanceCachedObjectProxy.extend({
    uiState: Ember.inject.service(),

    elements: null,  // this array stores the elements matched in the viewport
    itemComponentName: 'data-structure-annotation-item',

    active: Ember.computed.readOnly('isCurrentAnnotation'),
    isCurrentAnnotation: computedIsCurrentModelById('annotation'),
    key: Ember.computed('id', 'parent.id', function() {
        const id = this.get('id');
        const parentId = this.get('parent.id');
        return `item:${parentId}:annotation:${id}`;
    }),
    matches: Ember.computed.readOnly('elements.length'),

    init() {
        this._super();
        this.set('elements', []);
    }
});

const ItemAnnotation = RootItem.extend({
    itemComponentName: 'data-structure-item-annotation-item',

    annotations: Ember.computed.readOnly('item.annotations'),
    key: Ember.computed('id', 'parent.id', function() {
        const id = this.get('id');
        const parentId = this.get('parent.id');
        return `item:${parentId}:item-annotation:${id}`;
    }),
    name: Ember.computed.readOnly('content.name'),  // TODO: why does 'name' not work?
    schemaName: Ember.computed.readOnly('item.schema.name')
});

function wrapperForAnnotationModel(model) {
    return model instanceof ItemAnnotationModel ? ItemAnnotation : Annotation;
}

export default ToolPanel.extend({
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),

    annotationTree: null,
    title: 'Data structure',
    toolId: 'data-structure',

    annotationColors: Ember.computed('sample.orderedAnnotations', function() {
        const annotations = this.get('sample.orderedAnnotations');
        return annotations ? getColors(annotations.length + 1) : [];  // +1 for hover color
    }),

    init() {
        this._super();
        this.annotationTree = [
            RootItemList.create({
                toolPanel: this,
                container: this.get('container')
            })
        ];
    },

    updateHoverOverlayColor: Ember.observer('selected', 'annotationColors.length', function() {
        if (this.get('selected')) {
            this.set('browserOverlays.hoverOverlayColor', this.get('annotationColors.lastObject'));
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
