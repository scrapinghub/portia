import Ember from 'ember';
import DS from 'ember-data';
import Annotation from './annotation';


const ItemAnnotation = Annotation.extend({
    item: DS.belongsTo({
        async: true
    }),

    orderedAnnotations: Ember.computed.readOnly('item.orderedAnnotations'),
    orderedChildren: Ember.computed.readOnly('item.orderedChildren'),
    generalizedSelector: Ember.computed.readOnly('item.generalizedSelector')
});

ItemAnnotation.reopenClass({
    FIXTURES: [
        {
            id: 'ia1',
            name: 'details',
            type: 'schema',
            parent: 'ti1',
            item: 'ti2'
        }
    ]
});

export default ItemAnnotation;
