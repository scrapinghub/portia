import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
    parent: DS.belongsTo('item', {
        inverse: 'annotations'
    }),
    field: DS.belongsTo(),
    attribute: DS.attr('string'),
    // json fixes error with storing ember NativeArray in indexed db
    acceptSelectors: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),
    rejectSelectors: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),

    name: Ember.computed.readOnly('field.name'),
    type: Ember.computed.readOnly('field.type'),

    color: Ember.computed('orderedIndex', 'sample.annotationColors.length', function() {
        const colors = this.getWithDefault('sample.annotationColors', []);
        return colors[this.get('orderedIndex')];
    }),
    orderedIndex: Ember.computed('sample.orderedAnnotations', function() {
        return this.getWithDefault('sample.orderedAnnotations', []).indexOf(this);
    }),
    sample: Ember.computed.or('parent.sample', 'parent.itemAnnotation.sample')
});
