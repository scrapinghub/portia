import Ember from 'ember';
import ToolPanel from './tool-panel';

var RootItem = Ember.ObjectProxy.extend({
    //component: 'data-structure-root-item',
    name: Ember.computed.readOnly('schema.name'),
    key: Ember.computed('id', function() {
        return 'item:' + this.get('id');
    }),
    children: Ember.computed.map('annotations', annotation => {
        var modelName = annotation.get('_internalModel.modelName');
        if (modelName === 'item-annotation') {
            return ItemAnnotation.create({
                content: annotation
            });
        } else {
            return Annotation.create({
                content: annotation
            });
        }
    })
});

var RootItemList = Ember.Object.extend({
    //component: 'data-structure-root',
    name: 'Items',
    key: 'root',
    children: Ember.computed.map('sample.items', item => RootItem.create({
        content: item
    }))
});

var Annotation = Ember.ObjectProxy.extend({
    component: 'data-structure-annotation-item',
    key: Ember.computed('id', 'parent.id', function() {
        return 'item:' + this.get('parent.id') + ':annotation:' + this.get('id');
    })
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
/*
        return [
            {
                name: 'Items',
                key: 'root',
                children: this.get('sample.items').map(item => ({
                    name: item.get('name')
                }))
                children: [
                    {
                        name: 'Owl',
                        key: 'item:Owl',
                        children: [
                            {
                                name: 'name',
                                key: 'annotation:name'
                            },
                            {
                                name: 'price',
                                key: 'annotation:price'
                            },
                            {
                                name: 'description',
                                key: 'annotation:description'
                            }
                        ]
                    }
                ]
            }
        ];
*/
    })
});
