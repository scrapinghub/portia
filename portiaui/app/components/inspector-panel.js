import Ember from 'ember';
import { pathSelector } from '../utils/selectors';

export const IGNORED_ATTRIBUTES = new Set([
    'id', 'class', 'target', 'width', 'style', 'height', 'cellpadding',
    'cellspacing', 'border', 'bgcolor', 'color', 'colspan',
    'data-scrapy-annotate', 'data-tagid', 'data-genid', 'data-parentid'
]);

export function hasContentAttribute(element) {
    return Ember.$(element).attr('content') ? true : false;
}

export function getAttributeList(element) {
    if (!element) {
        return [];
    }
    var attributeList = [];
    var $element = Ember.$(element);
    var textContent = $element.text().trim();
    if (textContent) {
        let hasContent = hasContentAttribute(element);
        attributeList.push({
            name: hasContent ? 'text content' : 'content',
            attribute: hasContent ? 'text-content' : 'content',
            value: textContent
        });
    }
    var mappedAttributes = {};
    for (var i = 0; i < element.attributes.length; i++) {
        var attrib = element.attributes[i];
        if (attrib.name.startsWith('data-portia-')) {
            var originalName = attrib.name.slice('data-portia-'.length);
            if (!mappedAttributes[originalName]) {
                mappedAttributes[originalName] = attrib.value;
            }
        }
    }
    Array.prototype.slice.call(element.attributes).forEach(function(attribute) {
        if (!attribute.nodeName.startsWith('data-portia-') &&
                !IGNORED_ATTRIBUTES.has(attribute.nodeName) &&
                attribute.value) {
            attributeList.push({
                name: attribute.nodeName,
                attribute: attribute.nodeName,
                value: mappedAttributes[attribute.nodeName] || attribute.value
            });
        }
    });
    return attributeList;
}

export function getDefaultAttribute(element) {
    // TODO: Remove attributes that have been already annotated
    const attrList = getAttributeList(element);

    if (attrList.length === 1 && attrList[0].attribute) {
        // Only one possible attribute
        return attrList[0].attribute;
    }

    if (attrList.findBy('attribute', 'src')) {
        return 'src';
    } else if (attrList.findBy('attribute', 'href')) {
        return 'href';
    } else if (attrList.findBy('attribute', 'datetime')) {
        return 'datetime';
    } else if (attrList.findBy('attribute', 'content')) {
        return 'content';
    } else if (attrList.length) {
        return attrList[0].attribute;
    }

    return null;
}

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    attributes: Ember.computed('inspectedElement', function() {
        return getAttributeList(this.get('inspectedElement'));
    }),

    elementPath: Ember.computed('inspectedElement', function() {
        const element = this.get('inspectedElement');
        if (!element) {
            return '';
        }
        return pathSelector(element);
    }),

    elementParents: Ember.computed('originalSelectedElement', 'selectedElement', function() {
        const inspected = this.get('originalSelectedElement');
        const selected = this.get('selectedElement');
        if (!inspected) {
            return [];
        }
        return $(inspected).add($(inspected).parents()).toArray().map(element => ({
            element: element,
            tagName: element.tagName.toLowerCase(),
            selected: element === selected,
            isLast: element === inspected,
        }));
    }),

    elementChilds: Ember.computed('selectedElement', function() {
        const selected = this.get('selectedElement');
        return $(selected).children().toArray().map(element => ({
            element: element,
            tagName: element.tagName.toLowerCase()
        }));
    }),
    inspectedElement: Ember.computed.or(
        'uiState.viewPort.hoveredElement', 'uiState.viewPort.selectedElement'),
    originalSelectedElement: Ember.computed.alias('uiState.viewPort.originalSelectedElement'),
    selectedElement: Ember.computed.alias('uiState.viewPort.selectedElement'),
    isHovered: Ember.computed.bool('uiState.viewPort.hoveredElement'),

    actions: {
        addAnnotation(attribute) {
            this.get('dispatcher').addAnnotation(
                /* auto item */null, this.get('inspectedElement'), attribute, /* redirect = */true);
        },

        changeAnnotationSource(attribute) {
            const annotation = this.get('uiState.models.annotation');
            this.get('dispatcher').changeAnnotationSource(annotation, attribute);
        },

        selectParent(element) {
            this.set('selectedElement', element);
        },

        selectChild(element) {
            this.set('selectedElement', element);
            // Selecting sideways resets the originalSelectedElement
            this.set('uiState.viewPort.originalSelectedElement', element);
        },
    }
});
