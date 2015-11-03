import Ember from 'ember';
import DS from 'ember-data';
import Annotation from './annotation';


const ItemAnnotation = Annotation.extend({
    name: DS.attr('string'),
    item: DS.belongsTo({
        async: true,
        inverse: 'itemAnnotation'
    }),

    orderedAnnotations: Ember.computed.readOnly('item.orderedAnnotations'),
    orderedChildren: Ember.computed.readOnly('item.orderedChildren'),
    generalizedSelector: Ember.computed.readOnly('item.generalizedSelector')
});

export default ItemAnnotation;
