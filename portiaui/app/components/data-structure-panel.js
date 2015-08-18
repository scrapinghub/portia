import Ember from 'ember';
import ToolPanel from './tool-panel';

var RootItem = Ember.ObjectProxy.extend({
    //component: 'data-structure-root-item',
    name: Ember.computed.readOnly('schema.name'),
    key: Ember.computed('id', function() {
        return 'item:' + this.get('id');
    }),
    children: Ember.computed.map('annotations', function(annotation, index) {
        var modelName = annotation.get('_internalModel.modelName');
        var itemClass = modelName === 'item-annotation' ? ItemAnnotation : Annotation;
        return itemClass.create({
            content: annotation,
            // we're using array sorting so that nested annotations are grouped with parents
            colorOrder: this.getWithDefault('colorOrder', []).concat([index])
        });
    }),
    matches: Ember.computed('children.@each.matches', function() {
        return Math.max(0, ...this.get('children')
            .map(child => child.get('children') ? 0 : child.get('matches')));
    })
});

var RootItemList = Ember.Object.extend({
    //component: 'data-structure-root',
    name: 'Items',
    key: 'root',
    children: Ember.computed.map('sample.items', item => RootItem.create({
        content: item
    })),
    childMatches: Ember.computed.mapBy('children', 'matches'),
    matches: Ember.computed.sum('childMatches')
});

var Annotation = Ember.ObjectProxy.extend({
    component: 'data-structure-annotation-item',
    elements: [],  // this array stores the elements matched in the viewport
    key: Ember.computed('id', 'parent.id', function() {
        return 'item:' + this.get('parent.id') + ':annotation:' + this.get('id');
    }),
    matches: Ember.computed.readOnly('elements.length')
});

var ItemAnnotation = RootItem.extend({
    component: 'data-structure-item-annotation-item',
    name: Ember.computed.readOnly('content.name'),  // TODO: why does 'name' not work?
    schemaName: Ember.computed.readOnly('item.schema.name'),
    key: Ember.computed('id', 'parent.id', function() {
        return 'item:' + this.get('parent.id') + ':item-annotation:' + this.get('id');
    }),
    annotations: Ember.computed.readOnly('item.annotations')
});

export default ToolPanel.extend({
    title: 'Data structure',
    toolId: 'data-structure',
    annotationTree: Ember.computed('sample', function() {
        return [RootItemList.create({
            sample: this.get('sample')
        })];
    }),
    browserState: Ember.inject.service(),

    setMode: Ember.observer('selected', function() {
        var browserState = this.get('browserState');
        if (this.get('selected')) {
            browserState.setAnnotationMode();
        } else {
            browserState.clearAnnotationMode();
        }
    })
});
