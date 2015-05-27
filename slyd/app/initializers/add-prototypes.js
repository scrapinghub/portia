import Ember from 'ember';
import Attribute from '../models/attribute';

export function initialize() {
    Ember.$.fn.getUniquePath = function () {
        if (this.length !== 1) {
            throw 'Requires one element.';
        }
        var path, node = this;
        while (node.length) {
            var realNode = node[0], name = realNode.localName;
            if (!name) {
                break;
            }
            name = name.toLowerCase();
            var parent = node.parent();
            var siblings = parent.children(name);
            if (siblings.length > 1) {
                name += ':eq(' + siblings.index(realNode) + ')';
            }
            path = name + (path ? '>' + path : '');
            node = parent;
        }
        return path;
    };

    Ember.$.fn.getPath = function() {
        if (!this.prop('tagName')) {
            return;
        }
        var path = [this.prop('tagName').toLowerCase()];
        this.parents().not('html').each(function() {
            var entry = this.tagName.toLowerCase();
            path.push(entry);
        });
        return path.reverse().join(' > ');
    };

    Ember.$.fn.getAttributeList = function() {
        var attributeList = [],
            text_content_key = 'content';
        if (this.attr('content')) {
            text_content_key = 'text content';
        }
        if (this.text()) {
            attributeList.push(Attribute.create({
                name: text_content_key,
                value: this.text()}));
        }
        var element = this.get(0);
        if (!element) {
            return [];
        }
        Ember.$(element.attributes).each(function() {
            if (Ember.$.inArray(this.nodeName, Ember.$.fn.getAttributeList.ignoredAttributes) === -1 &&
                this.value) {
                attributeList.push(Attribute.create({
                    name: this.nodeName,
                    value: this.value}));
            }
        });
        return attributeList;
    };

    Ember.$.fn.getAttributeList.ignoredAttributes = ['id', 'class',
        'width', 'style', 'height', 'cellpadding',
        'cellspacing', 'border', 'bgcolor', 'color', 'colspan',
        'data-scrapy-annotate', 'data-tagid', 'data-genid', 'data-parentid'];

    Ember.$.fn.boundingBox = function() {
        if (!this || !this.offset()) {
            return {top: 0, left: 0, width: 0, height: 0};
        }
        var rect = {};
        rect.left = this.offset().left;
        rect.top = this.offset().top;
        rect.width = this.outerWidth();
        rect.height = this.outerHeight();
        return rect;
    };

    Ember.$.fn.isDescendant = function(parent) {
        return Ember.$(parent).find(this).length > 0;
    };

    Ember.$.fn.findAnnotatedElements = function() {
        return this.find('[data-scrapy-annotate]');
    };

    Ember.$.fn.findAnnotatedElement = function(annotationId) {
        var selector = '[data-scrapy-annotate*="' + annotationId + '"]';
        return this.find(selector);
    };

    Ember.$.fn.findIgnoredElements = function(annotationId) {
        var selector;
        if (annotationId) {
            selector = '[data-scrapy-ignore*="' + annotationId + '"], [data-scrapy-ignore-beneath*="' + annotationId + '"]';
        } else {
            selector = '[data-scrapy-ignore], [data-scrapy-ignore-beneath]';
        }
        return this.find(selector);
    };

    Ember.$.fn.removePartialAnnotation = function() {
        // FIXME: this may leave empty text node children.
        var element = this.get(0);
        var textNode = element.childNodes[0];
        var parentNode = element.parentNode;
        Ember.$(textNode).unwrap();
        parentNode.normalize();
    };

    Ember.$.fn.renameAttr = function(from, to) {
        return this.each(function() {
            var $this = Ember.$(this);
                $this.attr(to, $this.attr(from));
                $this.removeAttr(from);
        });
    };

    Ember.$.expr[':'].hasAttrWithPrefix = Ember.$.expr.createPseudo(function(prefix) {
        return function(obj) {
            for (var i = 0; i < obj.attributes.length; i++) {
                if (obj.attributes[i].nodeName.indexOf(prefix) === 0) {
                    return true;
                }
            }
            return false;
        };
    });

    String.prototype.lstrip = function() {
        return this.replace(/^[\s\r\n]*/g, "");
    };

    if (!String.prototype.trim) {
      (function() {
        // Make sure we trim BOM and NBSP
        var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        String.prototype.trim = function() {
          return this.replace(rtrim, '');
        };
      })();
    }
}

export default {
  name: 'add-prototypes',
  initialize: initialize
};
