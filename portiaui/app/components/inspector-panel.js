import Ember from 'ember';
import ToolPanel from './tool-panel';


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
                value: mappedAttributes[attribute.nodeName] || attribute.value
            });
        }
    });
    return attributeList;
}

export default ToolPanel.extend({
    viewPortSelection: Ember.inject.service(),

    classNames: ['inspector', 'container-fluid'],

    title: 'Inspector',
    toolId: 'inspector',

    attributes: Ember.computed('inspectedElement', function() {
        return getAttributeList(this.get('inspectedElement'));
    }),
    elementPath: Ember.computed('inspectedElement', function() {
        var element = this.get('inspectedElement');
        if (!element) {
            return '';
        }
        var elements = [element].concat(Ember.$(element).parents().not('html').toArray());
        return elements.reverse().map(element => element.tagName.toLowerCase()).join(' > ');
    }),
    inspectedElement: Ember.computed.or(
        'viewPortSelection.hoveredElement',
        'viewPortSelection.selectedElement')
});
