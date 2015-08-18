import Ember from 'ember';
import ToolPanel from './tool-panel';

const IGNORED_ATTRIBUTES = new Set([
    'id', 'class', 'target', 'width', 'style', 'height', 'cellpadding',
    'cellspacing', 'border', 'bgcolor', 'color', 'colspan',
    'data-scrapy-annotate', 'data-tagid', 'data-genid', 'data-parentid'
]);

function getAttributeList(element) {
    if (!element) {
        return [];
    }
    var attributeList = [];
    var $element = Ember.$(element);
    var textContent = $element.text();
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
    classNames: ['inspector', 'container-fluid'],
    hoveredElement: Ember.inject.service(),
    title: 'Inspector',
    toolId: 'inspector',

    elementPath: Ember.computed('hoveredElement.element', function() {
        var element = this.get('hoveredElement.element');
        if (!element) {
            return '';
        }
        var elements = [element].concat(Ember.$(element).parents().not('html').toArray());
        return elements.reverse().map(element => element.tagName.toLowerCase()).join(' > ');
    }),

    attributes: Ember.computed('hoveredElement.element', function() {
        return getAttributeList(this.get('hoveredElement.element'));
    })
});
