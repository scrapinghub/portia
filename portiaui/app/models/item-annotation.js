import Ember from 'ember';
import DS from 'ember-data';
import Annotation from './annotation';

export default Annotation.extend({
    name: DS.attr('string'),
    item: DS.belongsTo({
        async: true,
        inverse: 'itemAnnotation'
    }),
    repeated: DS.attr('boolean', {
        defaultValue() {
            return false;
        }
    }),
    repeatedTagid: DS.attr('string'), // Tagid of repeated container inside container
    siblings: DS.attr('number'),     // Number of siblings to look at for repeated container
    parentField: DS.attr('string'),   // Field to extract to in parent container

    acceptSelectors: null,
    rejectSelectors: null,

    orderedAnnotations: Ember.computed.readOnly('item.orderedAnnotations'),
    orderedChildren: Ember.computed.readOnly('item.orderedChildren')
});
