import Ember from 'ember';
import DS from 'ember-data';
import ItemAnnotation from './item-annotation';

const Item = DS.Model.extend({
    sample: DS.belongsTo(),
    schema: DS.belongsTo({
        async: true,
    }),
    annotations: DS.hasMany({
        async: true,
        inverse: 'parent',
        polymorphic: true
    }),
    itemAnnotation: DS.belongsTo({
        inverse: 'item'
    }),

    orderedAnnotations: Ember.computed(
        'annotations', 'annotations.@each.orderedAnnotations', function() {
            return [].concat(...this.get('annotations').map(annotation => (
                annotation instanceof ItemAnnotation ?
                    annotation.getWithDefault('orderedAnnotations', []) :
                    [annotation]
            )));
        }),
    orderedChildren: Ember.computed(
        'annotations.[]', 'annotations.@each.orderedChildren', function() {
            return [].concat(...this.get('annotations').map(annotation => (
                [annotation].concat(
                    annotation instanceof ItemAnnotation ?
                        annotation.getWithDefault('orderedChildren', []) :
                        []
                )
            )));
        })
});

export default Item;
