import Ember from 'ember';
import DS from 'ember-data';
import BaseAnnotation from './base-annotation';
import {
    elementPath,
    smartSelector
} from '../utils/selectors';

export default BaseAnnotation.extend({
    attribute: DS.attr('string', {
        defaultValue: 'content'
    }),
    required: DS.attr('boolean', {
        defaultValue: false
    }),
    repeated: DS.attr('boolean', {
        defaultValue: false
    }),
    selectionMode: DS.attr('string', {
        defaultValue: 'auto'
    }),
    selector: DS.attr('string'),
    xpath: DS.attr('string'),
    acceptSelectors: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),
    rejectSelectors: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),
    preText: DS.attr('string'),
    postText: DS.attr('string'),

    field: DS.belongsTo(),
    extractors: DS.hasMany(),

    name: Ember.computed.readOnly('field.name'),
    type: Ember.computed.readOnly('field.type'),
    ownerSample: Ember.computed.readOnly('parent.ownerSample'),

    orderedIndex: Ember.computed('ownerSample.orderedAnnotations', function() {
        return (this.get('ownerSample.orderedAnnotations') || []).indexOf(this);
    }),

    addElement(element) {
        this.moveElement(element, 'acceptSelectors', 'rejectSelectors');
    },

    removeElement(element) {
        this.moveElement(element, 'rejectSelectors', 'acceptSelectors');
    },

    moveElement(element, toProperty, fromProperty) {
        const toSelectors = this.get(toProperty);
        const fromSelectors = this.get(fromProperty);

        const path = elementPath(element);
        const root = path[0];
        const selector = smartSelector(element);

        const addSelectors = [];
        const removeSelectors = [];

        // a selector may match more than one element, we only want to remove the single element
        for (let fromSelector of fromSelectors) {
            const elements = Array.from(root.querySelectorAll(fromSelector));
            if (elements.includes(element)) {
                removeSelectors.addObject(fromSelector);
                elements.removeObject(element);
                for (let addElement of elements) {
                    addSelectors.addObject(smartSelector(addElement));
                }
            }
        }

        fromSelectors.removeObjects(removeSelectors);
        fromSelectors.addObjects(addSelectors);
        toSelectors.addObject(selector);
    },

    setSelector(selector) {
        this.setProperties({
            acceptSelectors: selector ? [selector] : [],
            rejectSelectors: []
        });
    }
});
