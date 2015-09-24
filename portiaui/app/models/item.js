import Ember from 'ember';
import DS from 'ember-data';
import ItemAnnotation from './item-annotation';
import {parentSelector, replacePrefix} from '../utils/selectors';


const Item = DS.Model.extend({
    sample: DS.belongsTo(),
    schema: DS.belongsTo({
        async: true
    }),
    annotations: DS.hasMany({
        async: true,
        inverse: 'parent',
        polymorphic: true
    }),
    itemAnnotation: DS.belongsTo(),

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

Item.reopenClass({
    FIXTURES: [
        {
            id: 'ti1',
            sample: 't1',
            schema: 'i1',
            annotations: [
                {
                    id: 'a1',
                    type: 'annotation'
                },
                {
                    id: 'a2',
                    type: 'annotation'
                },
                {
                    id: 'a3',
                    type: 'annotation'
                },
                {
                    id: 'a4',
                    type: 'annotation'
                },
                {
                    id: 'ia1',
                    type: 'item-annotation'
                }
            ]
        },
        {
            id: 'ti2',
            itemAnnotation: 'ia1',
            schema: 'i2',
            annotations: [
                {
                    id: 'a5',
                    type: 'annotation'
                },
                {
                    id: 'a6',
                    type: 'annotation'
                }
            ]
        }
    ]
});

export default Item;
