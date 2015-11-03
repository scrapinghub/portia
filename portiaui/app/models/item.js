import Ember from 'ember';
import DS from 'ember-data';
import ItemAnnotation from './item-annotation';
import {parentSelector, replacePrefix} from '../utils/selectors';


const Item = DS.Model.extend({
    sample: DS.belongsTo(),
    schema: DS.belongsTo(),
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
        }),
    generalizedSelector: Ember.computed(
        'annotations.[]', 'annotations.@each.generalizedSelector', function() {
            return parentSelector(
                this.getWithDefault('annotations', []).mapBy('generalizedSelector'));
        }),
    selector: Ember.computed('generalizedSelector', 'itemAnnotation.parent.selector', function() {
        let selector = this.get('generalizedSelector');
        const parent = this.get('itemAnnotation.parent.selector');
        if (parent) {
            selector = replacePrefix(selector, parent);
        }
        return selector;
    })
});

export default Item;
