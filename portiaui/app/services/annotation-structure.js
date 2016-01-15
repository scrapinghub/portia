import Ember from 'ember';
import {ElementPath} from '../utils/selectors';

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

    get elementPath() {
        return this._data.elementPath;
    }

    get selector() {
        return this.elementPath.uniquePathSelector;
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
                ElementPath.mergeMany(element.children.mapBy('elementPath'));
            }
            if (Array.isArray(acceptSelectors) &&
                Array.isArray(rejectSelectors)) {
                element.elementPath = ElementPath.fromAcceptedAndRejected(
                    acceptSelectors, rejectSelectors);
            }
        }
    });
}

export default Ember.Service.extend(Ember.Evented, {
    selectorMatcher: Ember.inject.service(),

    definition: null,
    _annotations: function() {
        let annotations = [];
        for (let nodes of this.selectorNodes) {
            annotations.push(nodes.elements);
        }
        return annotations;
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
                if (element.elementPath) {
                    const node = new SelectorNode(element);
                    selectorNodes.push(node);
                    nodeMap.set(node.annotation, node);
                    if (node.selector) {
                        selectorMatcher.register(node.selector, node, node.updateElements);
                    }
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
            if (node.selector) {
                selectorMatcher.unRegister(node.selector, node, node.updateElements);
            } else {
                node.updateElements([]);
            }
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
            if (node.selector) {
                selectorMatcher.unRegister(node.selector, node, node.updateElements);
            }
        });
        generalizeDefinitionSelectors(this.definition);
        this.selectorNodes.forEach(node => {
            if (node.selector) {
                selectorMatcher.register(node.selector, node, node.updateElements);
            } else {
                node.updateElements([]);
            }
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
