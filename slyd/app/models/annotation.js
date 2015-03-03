import Ember from 'ember';
import SimpleModel from './simple-model';
import Ignore from './ignore';

export default SimpleModel.extend({

    init: function() {
        this._super();
        if (!this.get('iframe')) {
            this.set('iframe', Ember.$(this[0]));
        }
        var ignoredElements = this.get('iframe').findIgnoredElements(this.get('id')).toArray();
        var ignores = ignoredElements.map(function(element) {
            var attributeName = Ember.$(element).attr('data-scrapy-ignore') ? 'data-scrapy-ignore' : 'data-scrapy-ignore-beneath';
            var name = Ember.$.parseJSON(Ember.$(element).attr(attributeName))['name'];
            return Ignore.create({element: element,
                                         name: name,
                                         ignoreBeneath: attributeName === 'data-scrapy-ignore-beneath'});
        });
        this.set('ignores', ignores);
        if (this.get('required') === null) {
            this.set('required', []);
        }
        if (this.get('annotations') === null) {
            this.set('annotations', {});
        }
    },

    idBinding: null,

    serializedProperties: ['id', 'variant', 'annotations', 'required', 'generated'],

    name: function() {
        var annotations = this.get('annotations');
        if (annotations && Object.keys(annotations).length) {
            var name = '';
            Object.keys(annotations).forEach(function(key) {
                name += (name.length ? ', ' : '') + key + '  >  ';
                name += annotations[key];
            });
            return name;
        } else {
            return 'No mappings';
        }
    }.property('annotations'),

    variant: 0,

    annotations: null,

    required: null,

    generated: false,

    ignores: null,

    addMapping: function(attribute, itemField) {
        this.get('annotations')[attribute] = itemField;
        this.notifyPropertyChange('annotations');
    },

    removeMapping: function(attribute) {
        this.removeRequired(this.get('annotations')[attribute]);
        delete this.get('annotations')[attribute];
        this.notifyPropertyChange('annotations');
    },

    removeMappings: function() {
        this.set('annotations', {});
        this.set('required', []);
        this.notifyPropertyChange('annotations');
    },

    addRequired: function(field) {
        this.get('required').pushObject(field);
    },

    removeRequired: function(field) {
        this.get('required').removeObject(field);
    },

    addIgnore: function(element) {
        var ignore = Ignore.create({element: element});
        this.get('ignores').pushObject(ignore);
    },

    removeIgnore: function(ignore) {
        this.get('ignores').removeObject(ignore);
    },

    removeIgnores: function() {
        this.get('ignores').setObjects([]);
    },

    partialText: function() {
        if (this.get('element') && this.get('generated')) {
            return Ember.$(this.get('element')).text();
        } else {
            return '';
        }
    }.property('element'),

    selectedElement: null,

    element: function() {
        if (this.get('selectedElement')) {
            return this.get('selectedElement');
        } else {
            var annotatedElement = this.get('iframe').findAnnotatedElement(this.get('id'));
            if (annotatedElement.length) {
                return annotatedElement.get(0);
            } else {
                return null;
            }
        }
    }.property('selectedElement'),

    path: function() {
        if (this.get('element')) {
            return Ember.$(this.get('element')).getUniquePath();
        } else {
            return '';
        }
    }.property('element'),

    ancestorPaths: function() {
        if (!this.get('element')) {
            return [];
        }
        var path = this.get('path'),
            splitted = path.split('>'),
            result = [],
            selector = '';
        splitted.forEach(function(pathElement) {
            var ancestorPath = {};
            selector += (selector ? '>' : '') + pathElement;
            ancestorPath['path'] = selector;
            var element = this.get('iframe').find(selector).get(0);
            ancestorPath['element'] = element;
            ancestorPath['label'] = element.tagName.toLowerCase();
            result.pushObject(ancestorPath);
        }.bind(this));
        return result;
    }.property('path'),

    childPaths: function() {
        if (!this.get('element')) {
            return [];
        }
        var result = [];
        if (this.get('element')) {
            var path = this.get('path');
            var children = this.get('element').children;
            children = Array.prototype.slice.call(children);
            children.forEach(function(child, i) {
                var childPath = {};
                childPath['label'] = child.tagName.toLowerCase();
                childPath['path'] = path + '>' + ':eq(' + i + ')';
                childPath['element'] = child;
                result.pushObject(childPath);
            });
        }
        return result;
    }.property('path'),

    attributes: function() {
        if (this.get('element')) {
            return Ember.$(this.get('element')).getAttributeList();
        } else {
            return [];
        }
    }.property('element'),

    unmappedAttributes: function() {
        return this.get('attributes').filter(
            function(attribute) {
                return !this.get('annotations')[attribute.get('name')];
            }.bind(this));
    }.property('attributes.@each', 'annotations'),

    _mappedAttributes: function(filter) {
        var mapped = [];
        if (this.get('annotations')) {
            this.get('attributes').forEach(function(attribute) {
                var mappedTo = this.get('annotations')[attribute.get('name')];
                if (filter(mappedTo)) {
                    attribute.set('mappedField', mappedTo);
                    mapped.addObject(attribute);
                }
            }.bind(this));
        }
        return mapped;
    },

    mappedAttributes: function() {
        return this._mappedAttributes(function(fieldName) {
            return fieldName && fieldName.indexOf('_sticky') !== 0;
        });
    }.property('attributes.@each', 'annotations'),

    stickyAttributes: function() {
        return this._mappedAttributes(function(fieldName) {
            return fieldName && fieldName.indexOf('_sticky') === 0;
        });
    }.property('attributes.@each', 'annotations'),
});