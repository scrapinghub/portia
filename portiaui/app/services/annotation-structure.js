import Ember from 'ember';
import {
    findContainer,
    findCssSelector,
    findRepeatedContainers,
    ElementPath
} from '../utils/selectors';

const ElementStructure = Ember.Object.extend({
    definition: null,
    selectorMatcher: null,

    init() {
        this._super(...arguments);
        this.addObservers();
    },

    destroy() {
        this.removeObservers();
        this._super(...arguments);
    },

    updateDefinition: Ember.observer('definition', function() {
        this.removeObservers();
        this.addObservers();
    }),

    addObservers() {
        const allElements = [];
        this.set('annotations', Ember.Object.create());
        this.set('elements', Ember.Object.create({
            all: allElements
        }));

        const bindings = this.bindings = [];
        const definition = this.get('definition');
        const selectorMatcher = this.get('selectorMatcher');

        const setup = element => {
            const annotation = element.annotation;
            const children = element.children;
            const guid = Ember.guidFor(annotation);

            const setElements = elements => {
                (annotation.get('elements') || []).forEach(element => {
                    allElements.removeObject(element);
                    const guid = Ember.guidFor(element);
                    const annotations = this.get(`annotations.${guid}`);
                    if (annotations) {
                        annotations.removeObject(annotation);
                        if (!annotations.length) {
                            this.set(`annotations.${guid}`, undefined);
                        }
                    }
                });
                elements.forEach(element => {
                    allElements.addObject(element);
                    const guid = Ember.guidFor(element);
                    let annotations = this.get(`annotations.${guid}`);
                    if (!annotations) {
                        annotations = [];
                        this.set(`annotations.${guid}`, annotations);
                        this.notifyPropertyChange('annotations');
                    }
                    annotations.addObject(annotation);
                });
                annotation.set('elements', elements);
                this.set(`elements.${guid}`, elements);
                this.notifyPropertyChange('elements');
            };

            if (children) {
                children.forEach(setup);

                bindings.push({
                    annotation,
                    observer() {
                        const childElements = children.map(
                            child => child.annotation.get('elements') || []);
                        let elements;
                        let containerPath = 'body';
                        const container = findContainer(childElements);
                        if (container) {
                            containerPath = findCssSelector(container);
                            elements = [container];
                        } else {
                            return; // No elements highlighted
                        }
                        const [repeatedContainers, siblings] = findRepeatedContainers(
                            childElements, container);
                        if (repeatedContainers.length) {
                            const repeatedContainerPath = findCssSelector(repeatedContainers[0]);
                            annotation.setProperties({
                                repeated: true,
                                repeatedAcceptSelectors: [repeatedContainerPath]
                            });
                            elements = repeatedContainers;
                        }
                        annotation.setProperties({
                            acceptSelectors: [containerPath],
                            siblings: siblings
                        });
                        setElements(elements);
                    },
                    observerPaths: ['item.annotations.content.@each.elements']
                });
            } else {
                let selector = null;
                bindings.push({
                    annotation,
                    observer() {
                        const acceptSelectors = annotation.get('acceptSelectors');
                        const rejectSelectors = annotation.get('rejectSelectors');
                        const elementPath = ElementPath.fromAcceptedAndRejected(
                            acceptSelectors, rejectSelectors);
                        if (selector) {
                            selectorMatcher.unRegister(selector, setElements);
                        }
                        selector = elementPath.uniquePathSelector;
                        annotation.setProperties({
                            elementPath,
                            selector
                        });
                        if (selector) {
                            selectorMatcher.register(selector, setElements);
                            setElements(selectorMatcher.query(selector));
                        }
                    },
                    cleanupObserver() {
                        selectorMatcher.unRegister(selector, setElements);
                    },
                    observerPaths: ['acceptSelectors.[]', 'rejectSelectors.[]']
                });
            }
        };

        definition.forEach(setup);

        for (let {annotation, observer, observerPaths} of bindings) {
            for (let path of observerPaths) {
                Ember.addObserver(annotation, path, observer);
            }
            observer();
        }
    },

    removeObservers() {
        for (let {annotation, observer, observerPaths, cleanupObserver} of this.bindings) {
            for (let path of observerPaths) {
                Ember.removeObserver(annotation, path, observer);
            }
            if (cleanupObserver) {
                cleanupObserver();
            }
        }
        this.bindings = [];

        for (let property of ['annotations', 'elements']) {
            const object = this.get(property);
            if (object) {
                object.destroy();
            }
            this.set(property, null);
        }
    }
});

const DataElementStructure = ElementStructure.extend({
    model: null,  // a sample

    definition: Ember.computed('model.orderedAnnotations.[]', function() {
        return this.get('model.items').filter(item => !!item).map(item => ({
            annotation: item.get('itemAnnotation'),
            children: item.get('annotations').map(function mapper(annotation) {
                if (annotation.constructor.modelName === 'annotation') {
                    return {
                        annotation
                    };
                } else if (annotation.constructor.modelName === 'item-annotation') {
                    return {
                        annotation,
                        children: (annotation.get('item.annotations') || []).map(mapper)
                    };
                }
            })
        }));
    })
});

export default Ember.Service.extend({
    selectorMatcher: Ember.inject.service(),

    addStructure(model, attribute, Class) {
        if (!model) {
            return;
        }

        const selectorMatcher = this.get('selectorMatcher');
        model.set(attribute, Class.create({
            selectorMatcher,
            model
        }));
    },

    removeStructure(model, attribute) {
        if (!model) {
            return;
        }

        const structure = model.get(attribute);
        if (structure) {
            structure.destroy();
            model.set(attribute, null);
        }
    },

    addDataStructure(sample) {
        this.addStructure(sample, 'dataStructure', DataElementStructure);
    },

    removeDataStructure(sample) {
        this.removeStructure(sample, 'dataStructure');
    }
});
