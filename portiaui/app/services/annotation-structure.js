import Ember from 'ember';

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
    constructor(model, selector) {
        this.model = model;
        this.selector = selector;
        this.elements = [];
    }

    updateElements(elements) {
        this.elements.forEach(element => {
            getOrCreateElement(element).annotations.removeObject(this.model);
        });
        elements.forEach(element => {
            getOrCreateElement(element).annotations.addObject(this.model);
        });
        this.elements = elements;
    }
}

export default Ember.Service.extend(Ember.Evented, {
    selectorMatcher: Ember.inject.service(),

    definition: null,

    init() {
        this._super();
        this.get('selectorMatcher').watch(this, this.updateElements);
    },

    setSelectors(definition) {
        this.clearSelectors();
        const selectorMatcher = this.get('selectorMatcher');
        definition = definition.map(function mapper(element) {
            if (Array.isArray(element)) {
                return element.map(mapper);
            } else if (element.model && element.selector) {
                const node = new SelectorNode(element.model, element.selector);
                nodeMap.set(element.model, node);
                selectorMatcher.register(node.selector, node, node.updateElements);
                return node;
            }
        });
        this.definition = definition;
    },

    clearSelectors() {
        const selectorMatcher = this.get('selectorMatcher');
        if (Array.isArray(this.definition)) {
            this.definition.forEach(function mapper(node) {
                if (Array.isArray(node)) {
                    node.forEach(mapper);
                } else if (node instanceof SelectorNode) {
                    selectorMatcher.unRegister(node.selector, node, node.updateElements);
                }
            });
        }
        this.definition = null;
        nodeMap.clear();
        elementsMap.clear();
        this.updateElements();
    },

    updateElements() {
        const data = Array.from(elementsMap.values());
        this.trigger('elements', data);
    },

    register(target, method) {
        this.on('elements', target, method);
    },

    unRegister(target, method) {
        this.off('elements', target, method);
    },

    elementsFor(model) {
        const node = nodeMap.get(model);
        return node && node.elements;
    },

    annotationsFor(element) {
        return (getElement(element) || {}).annotations;
    }
});
