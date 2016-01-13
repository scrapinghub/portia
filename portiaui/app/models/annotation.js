import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
    parent: DS.belongsTo('item', {
        inverse: 'annotations',
        async: false
    }),
    field: DS.belongsTo({
        async: false
    }),
    attribute: DS.attr('string'),
    tagid: DS.attr('string'),
    required: DS.attr('boolean'),
    ignore: DS.attr('boolean'),
    ignoreBeneath: DS.attr('boolean'),
    variant: DS.attr('number'),
    slice: DS.attr('array'),

    // selection
    selectionMode: DS.attr('string', {
        defaultValue: 'auto'
    }),
    // json fixes error with storing ember NativeArray in indexed db
    acceptSelectors: DS.attr('array'),
    rejectSelectors: DS.attr('array'),

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
