import Ember from 'ember';
import {
    AnnotationSelectorGenerator,
    ContainerSelectorGenerator
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
                if (!annotation.get('isDeleted')) {
                    annotation.set('elements', elements);
                }
                this.set(`elements.${guid}`, elements);
                this.notifyPropertyChange('elements');
            };

            if (children) {
                children.forEach(setup);

                let selector = null;
                const observer = () => {
                    if (selector) {
                        selectorMatcher.unRegister(selector, setElements);
                    }
                    selector = annotation.get('selectorGenerator.selector');
                    const containerSelector = annotation.get(
                        'selectorGenerator.containerSelector');
                    const siblings = annotation.get('selectorGenerator.siblings');
                    if (selector) {
                        selectorMatcher.register(selector, setElements);
                        const element = selectorMatcher.query(selector);
                        setElements(element);

                        if (!annotation.get('isDeleted')) {
                            if (!element.length) {
                                annotation.setProperties({
                                    selector: null,
                                    repeatedSelector: null,
                                    siblings: 0
                                });
                            } else if (element.length > 1) {
                                annotation.setProperties({
                                    selector: containerSelector,
                                    repeatedSelector: selector,
                                    siblings
                                });
                            } else {
                                annotation.setProperties({
                                    selector,
                                    repeatedSelector: null,
                                    siblings
                                });
                            }
                        }
                    }
                };

                let scheduledObserver = null;
                bindings.push({
                    annotation,
                    setup() {
                        const selectorGenerator = ContainerSelectorGenerator.create({});
                        selectorGenerator.addChildren(
                            children.map(child => child.annotation.get('selectorGenerator')));
                        annotation.set('selectorGenerator', selectorGenerator);
                    },
                    teardown() {
                        Ember.run.cancel(scheduledObserver);
                        if (selector) {
                            selectorMatcher.unRegister(selector, setElements);
                        }
                        const selectorGenerator = annotation.get('selectorGenerator');
                        if(selectorGenerator) {
                            selectorGenerator.destroy();
                        }
                        annotation.setProperties({
                            selectorGenerator: undefined,
                            elements: undefined
                        });
                    },
                    observer() {
                        // allow the bindings to sync first
                        scheduledObserver = Ember.run.scheduleOnce('sync', observer);
                    },
                    observerPaths: ['selectorGenerator.selector']
                });
            } else {
                let selector = null;
                const observer = () => {
                    if (selector) {
                        selectorMatcher.unRegister(selector, setElements);
                    }
                    selector = annotation.get('selectorGenerator.selector');
                    if (!annotation.get('isDeleted')) {
                        annotation.setProperties({
                            selector,
                            xpath: annotation.get('selectorGenerator.xpath')
                        });
                    }
                    if (selector) {
                        selectorMatcher.register(selector, setElements);
                        setElements(selectorMatcher.query(selector));
                    }
                };

                let scheduledObserver = null;
                bindings.push({
                    annotation,
                    setup() {
                        annotation.set('selectorGenerator', AnnotationSelectorGenerator.create({
                            selectorMatcher,
                            annotation
                        }));
                    },
                    teardown() {
                        Ember.run.cancel(scheduledObserver);
                        if (selector) {
                            selectorMatcher.unRegister(selector, setElements);
                        }
                        const selectorGenerator = annotation.get('selectorGenerator');
                        if(selectorGenerator) {
                            selectorGenerator.destroy();
                        }
                        annotation.setProperties({
                            selectorGenerator: undefined,
                            elements: undefined
                        });
                    },
                    observer() {
                        // allow the bindings to sync first
                        scheduledObserver = Ember.run.scheduleOnce('sync', observer);
                    },
                    observerPaths: ['selectorGenerator.selector']
                });

                // force a re-computation if the elements matched by acceptSelectors or
                // rejectSelectors change (when the page is loading).
                // TODO: remove when the selector will be synced with the backend
                let watchSelector = null;
                const triggerUpdate = () => {
                    annotation.notifyPropertyChange('acceptSelectors');
                    annotation.notifyPropertyChange('rejectSelectors');
                };
                const stopWatching = () => {
                    if (watchSelector) {
                        selectorMatcher.unRegister(watchSelector, triggerUpdate);
                        watchSelector = null;
                    }
                };
                bindings.push({
                    annotation,
                    setup() {
                        watchSelector = [].concat(
                            annotation.get('acceptSelectors'),
                            annotation.get('rejectSelectors')).join(', ');
                        if (watchSelector) {
                            selectorMatcher.register(watchSelector, triggerUpdate);
                        }
                    },
                    teardown: stopWatching,
                    observer() {
                        if (watchSelector) {
                            const newWatchSelector = [].concat(
                                annotation.get('acceptSelectors'),
                                annotation.get('rejectSelectors')).join(', ');
                            if (newWatchSelector !== watchSelector) {
                                stopWatching();
                            }
                        }
                    },
                    observerPaths: ['acceptSelectors.[]', 'rejectSelectors.[]']
                });
            }
        };

        definition.forEach(setup);

        for (let {setup} of bindings) {
            if (setup) {
                setup();
            }
        }
        for (let {annotation, observer, observerPaths} of bindings) {
            if (observer) {
                for (let path of observerPaths) {
                    Ember.addObserver(annotation, path, observer);
                }
                observer();
            }
        }
    },

    removeObservers() {
        for (let {annotation, observer, observerPaths, teardown} of this.bindings) {
            if (observer) {
                for (let path of observerPaths) {
                    Ember.removeObserver(annotation, path, observer);
                }
            }
            if (teardown) {
                teardown();
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
        return (this.get('model.items') || []).filter(
            item => !!item).map(function mapper(annotation) {
                if (annotation.constructor.modelName === 'annotation') {
                    return {
                        annotation
                    };
                } else if (annotation.constructor.modelName === 'item') {
                    return {
                        annotation,
                        children: (annotation.get('annotations') || []).map(mapper)
                    };
                }
            });
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
