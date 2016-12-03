import Ember from 'ember';
import DS from 'ember-data';
import BaseAnnotation from './base-annotation';

export default BaseAnnotation.extend({
    name: DS.attr('string'),
    selector: DS.attr('string'),
    repeatedSelector: DS.attr('string'),
    siblings: DS.attr('number', {
        defaultValue: 0
    }),

    sample: DS.belongsTo(),
    schema: DS.belongsTo(),
    annotations: DS.hasMany('base-annotation', {
        inverse: 'parent',
        polymorphic: true
    }),

    ownerSample: Ember.computed(function() {
        return DS.PromiseObject.create({
            promise: this.get('sample').then(sample => sample || this.get('parent.ownerSample'))
        });
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
        }),

    depth: Ember.computed('parent.depth', function() {
        let parentDepth = this.get('parent.depth');
        return (parentDepth || 0) + 1;
    })
});
