import Ember from 'ember';
import {ElementPath} from '../utils/selectors';

export const IGNORED_ATTRIBUTES = new Set([
    'id', 'class', 'target', 'width', 'style', 'height', 'cellpadding',
    'cellspacing', 'border', 'bgcolor', 'color', 'colspan',
    'data-scrapy-annotate', 'data-tagid', 'data-genid', 'data-parentid'
]);

export function getAttributeList(element) {
    if (!element) {
        return [];
    }
    var attributeList = [];
    var $element = Ember.$(element);
    var textContent = $element.text().trim();
    if (textContent) {
        attributeList.push({
            name: $element.attr('content') ? 'text content' : 'content',
            attribute: null,
            value: textContent
        });
    }
    var mappedAttributes = {};
    for (var i = 0; i < element.attributes.length; i++) {
        var attrib = element.attributes[i];
        if (attrib.name.startsWith('_portia_')) {
            var originalName = attrib.name.slice(8);
            if (!mappedAttributes[originalName]) {
                mappedAttributes[originalName] = attrib.value;
            }
        }
    }
    Array.prototype.slice.call(element.attributes).forEach(function(attribute) {
        if (!attribute.nodeName.startsWith('_portia_') &&
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
        return new ElementPath(element).pathSelector;
    }),
    inspectedElement: Ember.computed.or(
        'uiState.viewPort.hoveredElement', 'uiState.viewPort.selectedElement'),

    actions: {
        addAnnotation(attribute) {
            this.get('dispatcher').addAnnotation(
                /* auto item */null, this.get('inspectedElement'), attribute, /* redirect = */true);
        },

        changeAnnotationSource(attribute) {
            const annotation = this.get('uiState.models.annotation');
            this.get('dispatcher').changeAnnotationSource(annotation, attribute);
        }
    }
});
