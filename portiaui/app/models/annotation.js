import Ember from 'ember';
import DS from 'ember-data';
import {generalizeSelectors} from '../utils/selectors';


const Annotation = DS.Model.extend({
    name: DS.attr('string'),
    parent: DS.belongsTo('item', {
        inverse: 'annotations'
    }),
    type: DS.attr('string'),
    attribute: DS.attr('string'),
    acceptSelectors: DS.attr({
        defaultValue: []
    }),
    rejectSelectors: DS.attr({
        defaultValue: []
    }),

    // matching element in the current sample, populated when active
    elements: [],

    color: Ember.computed('orderedIndex', 'sample.annotationColors.length', function() {
        const colors = this.getWithDefault('sample.annotationColors', []);
        return colors[this.get('orderedIndex')];
    }),
    orderedIndex: Ember.computed('sample.orderedAnnotations', function() {
        return this.getWithDefault('sample.orderedAnnotations', []).indexOf(this);
    }),
    sample: Ember.computed.or('parent.sample', 'parent.itemAnnotation.sample'),
    selector: Ember.computed('acceptSelectors.[]', 'rejectSelectors.[]', function() {
        const accept = this.get('acceptSelectors');
        const reject = this.get('rejectSelectors');
        return generalizeSelectors(accept, reject);
    })
});

Annotation.reopenClass({
    FIXTURES: [
        {
            id: 'a1',
            name: 'name',
            type: 'text',
            parent: 'ti1',
            acceptSelectors: [
                'body > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > ul:nth-child(1)' +
                ' > li:nth-child(1) > h3:nth-child(1) > a:nth-child(1)',
                'body > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > ul:nth-child(1)' +
                ' > li:nth-child(1) > h3:nth-child(1) > a:nth-child(1)'
            ]
        },
        {
            id: 'a2',
            name: 'price',
            type: 'price',
            parent: 'ti1',
            acceptSelectors: [
                'body > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > ul:nth-child(1)' +
                ' > li:nth-child(1) > h3:nth-child(1)'
            ]
        },
        {
            id: 'a3',
            name: 'image',
            type: 'image',
            parent: 'ti1',
            acceptSelectors: [
                'body > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > img:nth-child(1)'
            ],
            attribute: 'src'
        },
        {
            id: 'a4',
            name: 'description',
            type: 'text',
            parent: 'ti1',
            acceptSelectors: [
                'body > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > ul:nth-child(1)' +
                ' > li:nth-child(2)'
            ]
        },
        {
            id: 'a5',
            name: 'property',
            type: 'text',
            parent: 'ti2',
            acceptSelectors: [
                'body > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > ul:nth-child(1)' +
                ' > li:nth-child(2) > strong:nth-child(1)',
                'body > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > ul:nth-child(1)' +
                ' > li:nth-child(3) > strong:nth-child(1)'
            ]
        },
        {
            id: 'a6',
            name: 'value',
            type: 'text',
            parent: 'ti2',
            acceptSelectors: [
                'body > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > ul:nth-child(1)' +
                ' > li:nth-child(2) > span:nth-child(2)'
            ]
        }
    ]
});

export default Annotation;
