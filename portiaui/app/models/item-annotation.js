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

export default ItemAnnotation;
