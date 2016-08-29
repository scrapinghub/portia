import Ember from 'ember';
import { AnnotationSelectorGenerator, ContainerSelectorGenerator } from '../utils/selectors';

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
                    selector = annotation.get('repeatedSelector') || annotation.get('selector');
                    if (selector) {
                        selectorMatcher.register(selector, setElements);
                        setElements(selectorMatcher.query(selector));
                    }
                };

                let scheduledObserver = null;
                bindings.push({
                    annotation,
                    setup() {
                        const selectorGenerator = ContainerSelectorGenerator.create({});
                        selectorGenerator.addChildren(
                            children.map(child => child.annotation.get('containerGenerator') ||
                                                  child.annotation.get('selectorGenerator')));
                        annotation.set('selectorGenerator', selectorGenerator);
                    },
                    teardown() {
                        Ember.run.cancel(scheduledObserver);
                        if (selector) {
                            selectorMatcher.unRegister(selector, setElements);
                        }
                        annotation.setProperties({
                            elements: undefined
                        });
                    },
                    observer() {
                        // allow the bindings to sync first
                        scheduledObserver = Ember.run.scheduleOnce('sync', observer);
                    },
                    observerPaths: ['selector', 'repeatedSelector']
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
                            xpath: annotation.get('selectorGenerator.xpath'),
                            repeated: annotation.get('selectorGenerator.repeatedAnnotation')
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
                        const selectorGenerator = AnnotationSelectorGenerator.create({
                             selectorMatcher,
                             annotation
                        });
                        let containerGenerator = ContainerSelectorGenerator.create({});
                        containerGenerator.addChildren([selectorGenerator]);
                        annotation.setProperties({
                            selectorGenerator,
                            containerGenerator
                        });
                    },
                    teardown() {
                        Ember.run.cancel(scheduledObserver);
                        if (selector) {
                            selectorMatcher.unRegister(selector, setElements);
                        }
                        const selectorGenerator = annotation.get('selectorGenerator');
                        const containerGenerator = annotation.get('containerGenerator');
                        if (selectorGenerator) {
                             selectorGenerator.destroy();
                         }
                        if (containerGenerator) {
                            containerGenerator.destroy();
                        }
                        annotation.setProperties({
                             selectorGenerator: undefined,
                             containerGenerator: undefined,
                             elements: undefined
                        });
                    },
                    observer() {
                        // allow the bindings to sync first
                        scheduledObserver = Ember.run.scheduleOnce('sync', observer);
                    },
                    observerPaths: ['selector']
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
    definition: [],

    setDefinition: Ember.on('init', Ember.observer('model.orderedAnnotations.[]', function() {
        const sample = this.get('model');
        if (!sample) {
            this.set('definition', []);
        }
        const structurePromise = createStructure(sample);
        this.currentPromise = structurePromise;
        structurePromise.then(structure => {
            if (structurePromise === this.currentPromise) {
                delete this.currentPromise;
                this.set('definition', structure);
            }
        });
    }))
});

export function createStructure(sample) {
    return sample.get('items').then(items =>
        Ember.RSVP.filter(items.toArray(), item =>
            item && !item.get('isDeleted')
        ).then(filteredItems =>
            Ember.RSVP.map(filteredItems, item =>
                Ember.RSVP.hash({
                    annotation: item,
                    children: item.get('annotations').then(function mapper(annotations) {
                        if (!annotations) {
                            return [];
                        }
                        return Ember.RSVP.filter(annotations.toArray(), annotation =>
                            !annotation.get('isDeleted')
                        ).then(filteredAnnotations =>
                            Ember.RSVP.map(filteredAnnotations, annotation => {
                                if (annotation.constructor.modelName === 'annotation') {
                                    return {
                                        annotation
                                    };
                                } else if (annotation.constructor.modelName === 'item') {
                                    return Ember.RSVP.hash({
                                        annotation,
                                        children: annotation.get('annotations').then(mapper)
                                    });
                                }
                            })
                        );
                    })
                })
            )
        )
    );
}

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
