import Ember from 'ember';
import {generalizeSelectors, parentSelector, replacePrefix} from '../utils/selectors';

const elementsMap = new Map();
const nodeMap = new Map();

function getElement(element) {
    const guid = Ember.guidFor(element);
    return elementsMap.get(guid);
}

function getOrCreateElement(element) {
    const guid = Ember.guidFor(element);
    if (!elementsMap.has(guid)) {
        elementsMap.set(guid, {
            guid,
            element,
            annotations: []
        });
    }
    return elementsMap.get(guid);
}

class SelectorNode {
    constructor(data) {
        this._data = data;
        this.elements = [];
    }

    get annotation() {
        return this._data.annotation;
    }

    get acceptSelectors() {
        return this._data.acceptSelectors;
    }

    get rejectSelectors() {
        return this._data.rejectSelectors;
    }

    get selector() {
        return this._data.selector;
    }

    updateElements(elements) {
        this.elements.forEach(element => {
            getOrCreateElement(element).annotations.removeObject(this.annotation);
        });
        elements.forEach(element => {
            getOrCreateElement(element).annotations.addObject(this.annotation);
        });
        this.elements = elements;
    }
}

function generalizeDefinitionSelectors(definition) {
    definition.forEach(function generalize(element) {
        if (element.annotation) {
            const acceptSelectors = element.annotation.get('acceptSelectors');
            const rejectSelectors = element.annotation.get('rejectSelectors');
            element.acceptSelectors = acceptSelectors;
            element.rejectSelectors = rejectSelectors;
            if (element.children) {
                element.children.forEach(generalize);
                element.parentSelector = parentSelector(element.children.mapBy('selector'));
            }
            if (Array.isArray(acceptSelectors) &&
                Array.isArray(rejectSelectors)) {
                element.selector = generalizeSelectors(acceptSelectors, rejectSelectors);
            }
        }
    });
    definition.forEach(function applyParent(element) {
        if (element.annotation) {
            if (element.children) {
                element.children.forEach(child => {
                    if (child.selector) {
                        child.selector = replacePrefix(child.selector, element.parentSelector);
                    }
                    if (child.parentSelector) {
                        child.parentSelector = replacePrefix(
                            child.parentSelector, element.parentSelector);
                    }
                    applyParent(child);
                });
            }
        }
    });
}

export default Ember.Service.extend(Ember.Evented, {
    selectorMatcher: Ember.inject.service(),

    definition: null,
    _annotations: function() {
        return nodeMap.values();
    },

    init() {
        this._super();
        this.selectorNodes = [];
        this.get('selectorMatcher').watch(this, this.update);
    },

    setDefinition(definition) {
        this.clearDefinition();
        const selectorMatcher = this.get('selectorMatcher');
        const selectorNodes = this.selectorNodes;
        generalizeDefinitionSelectors(definition);
        const self = this;
        definition.forEach(function mapper(element) {
            if (element.annotation) {
                if (element.selector) {
                    const node = new SelectorNode(element);
                    selectorNodes.push(node);
                    nodeMap.set(node.annotation, node);
                    selectorMatcher.register(node.selector, node, node.updateElements);
                    Ember.addObserver(
                        node.annotation, 'acceptSelectors.[]', self, self.updateDefinition);
                    Ember.addObserver(
                        node.annotation, 'rejectSelectors.[]', self, self.updateDefinition);
                    return node;
                }
                if (element.children) {
                    element.children.forEach(mapper);
                }
            }
        });
        this.definition = definition;
    },

    clearDefinition() {
        const selectorMatcher = this.get('selectorMatcher');
        this.selectorNodes.forEach(node => {
            Ember.removeObserver(
                node.annotation, 'acceptSelectors.[]', this, this.updateDefinition);
            Ember.removeObserver(
                node.annotation, 'rejectSelectors.[]', this, this.updateDefinition);
            selectorMatcher.unRegister(node.selector, node, node.updateElements);
        });
        this.definition = null;
        this.selectorNodes = [];
        nodeMap.clear();
        elementsMap.clear();
        this.update();
    },

    updateDefinition() {
        const selectorMatcher = this.get('selectorMatcher');
        this.selectorNodes.forEach(node => {
            selectorMatcher.unRegister(node.selector, node, node.updateElements);
        });
        generalizeDefinitionSelectors(this.definition);
        this.selectorNodes.forEach(node => {
            selectorMatcher.register(node.selector, node, node.updateElements);
        });
    },

    update() {
        const elements = Array.from(elementsMap.values());
        this.trigger('elements', elements);
        const annotations = Array.from(nodeMap.values());
        this.trigger('annotations', annotations);
        this.trigger('change');
    },

    register(event, target, method) {
        this.on(event, target, method);
    },

    unRegister(event, target, method) {
        this.off(event, target, method);
    },

    registerElements(target, method) {
        this.on('elements', target, method);
    },

    unRegisterElements(target, method) {
        this.off('elements', target, method);
    },

    registerAnnotations(target, method) {
        this.on('annotations', target, method);
    },

    unRegisterAnnotations(target, method) {
        this.off('annotations', target, method);
    },

    registerChange(target, method) {
        this.on('change', target, method);
    },

    unRegisterChange(target, method) {
        this.off('change', target, method);
    },

    elementsFor(model) {
        const node = nodeMap.get(model);
        return node && node.elements;
    },

    annotationsFor(element) {
        return (getElement(element) || {}).annotations;
    }
});
