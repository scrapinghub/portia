import Ember from 'ember';
import DS from 'ember-data';
import BaseModel from './base';

export default BaseModel.extend({
    name: DS.attr('string'),
    selector: DS.attr('string'),
    repeatedSelector: DS.attr('string'),
    siblings: DS.attr('number', {
        defaultValue: 0
    }),

    sample: DS.belongsTo(),
    // parent: DS.belongsTo('item'),
    schema: DS.belongsTo(),
    annotations: DS.hasMany({
        inverse: 'parent',
        polymorphic: true
    }),

    orderedAnnotations: Ember.computed(
        'annotations', 'annotations.@each.orderedAnnotations', function() {
            return [].concat(...this.get('annotations').map(annotation => (
                annotation.constructor.modelName === 'item' ?
                    annotation.getWithDefault('orderedAnnotations', []) :
                    [annotation]
            )));
        }),
    orderedChildren: Ember.computed(
        'annotations.[]', 'annotations.@each.orderedChildren', function() {
            return [].concat(...this.get('annotations').map(annotation => (
                [annotation].concat(
                    annotation.constructor.modelName === 'item' ?
                        annotation.getWithDefault('orderedChildren', []) :
                        []
                )
            )));
        })
});
