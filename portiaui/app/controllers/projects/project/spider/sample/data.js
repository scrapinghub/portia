import Ember from 'ember';
import {getColors} from '../../../../../utils/colors';
import {BaseSelectorGenerator, elementPath} from '../../../../../utils/selectors';

export default Ember.Controller.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    selectionModeIcons: {
        select: 'tool-select',
        add: 'tool-add',
        remove: 'tool-remove',
        edit: 'tool-multiple'
    },
    selectionModeText: {
        select: 'Select an existing annotation',
        add: 'Add a new annotation',
        remove: 'Remove an annotation',
        edit: 'Add/remove extra elements from an existing annotation'
    },
    selectionModeIds: {
        select: 'tool-select-button',
        add: 'tool-add-button',
        remove: 'tool-remove-button',
        edit: 'tool-multiple-button'
    },

    cssEnabled: Ember.computed.readOnly('browser.cssEnabled'),
    magicToolActive: Ember.computed.alias('uiState.selectedTools.magicToolActive'),
    hoveredElement: Ember.computed.readOnly('uiState.viewPort.hoveredElement'),
    originalSelectedElement: Ember.computed.alias('uiState.viewPort.originalSelectedElement'),
    sample: Ember.computed.readOnly('model'),
    selectedModel: Ember.computed.alias('uiState.viewPort.selectedModel'),
    selectionMode: Ember.computed.alias('uiState.selectedTools.selectionMode'),

    hoveredModels: Ember.computed(
        'uiState.viewPort.hoveredModels', 'hoveredElement', 'sample.dataStructure.annotations', {
            get(key) {
                const hoveredModels = this.get('uiState.viewPort.hoveredModels');
                if (hoveredModels !== this._hoveredModels) {
                    return this.set(key, hoveredModels);
                }
                const hoveredElement = this.get('hoveredElement');
                let models;
                if (hoveredElement) {
                    const annotations = this.get('sample.dataStructure.annotations');
                    models = annotations && annotations.get(Ember.guidFor(hoveredElement));
                }
                models = (models || []).filterBy('constructor.modelName', 'annotation');
                return this.set(key, models);
            },

            set(key, value) {
                this._hoveredModels = value;
                return this.set('uiState.viewPort.hoveredModels', value);
            }
        }),

    selectedModelElements: Ember.computed('selectedModel.elements', function() {
        return this.get('selectedModel.elements') || [];
    }),

    selectedElement: Ember.computed(
        'uiState.viewPort.selectedElement', 'selectedModelElements.[]', {
            get() {
                const selectedElement = this.get('uiState.viewPort.selectedElement');
                const selectedModelElements = this.get('selectedModelElements');
                if (selectedElement && selectedModelElements.includes(selectedElement)) {
                    return selectedElement;
                }
                return this.set('selectedElement', selectedModelElements[0]);
            },

            set(key, value) {
                return this.set('uiState.viewPort.selectedElement', value);
            }
        }),

    activeSelectionMode: Ember.computed(
        'selectionMode', 'magicToolActive',
        'hoveredElement', 'hoveredModels.[]', 'selectedElement', 'selectedModel',
        'selectedModelElements.length',
        'generalizableModel', function() {
            const selectedMode = this.get('selectionMode');
            const magicToolActive = this.get('magicToolActive');
            if (selectedMode) {
                return selectedMode;
            } else if (magicToolActive) {
                const hoveredElement = this.get('hoveredElement');
                const hoveredModels = this.getWithDefault('hoveredModels', []);
                const selectedModel = this.get('selectedModel');
                if (hoveredModels.length) {
                    if (hoveredModels.includes(selectedModel)) {
                        if (this.get('selectedModelElements.length') === 1) {
                            return 'remove';
                        }
                        return 'edit';
                    } else {
                        return 'select';
                    }
                } else if (hoveredElement) {
                    if (this.get('generalizableModel') ||
                        (selectedModel && this.get('selectedModelElements.length') === 0)) {
                        return 'edit';
                    }
                    return 'add';
                }
                return 'select';
            }
        }),
    annotationColors: Ember.computed(
        'sample.orderedAnnotations.length', 'activeSelectionMode', 'hoveredElement', function() {
            const annotations = this.getWithDefault('sample.orderedAnnotations.length', 0);
            if (this.get('activeSelectionMode') === 'add' && this.get('hoveredElement')) {
                return getColors(annotations + 1);
            }
            if (annotations) {
                return getColors(annotations);
            }
            return [];
        }),
    generalizableModel: Ember.computed(
        'selectionMode', 'selectedModel', 'hoveredElement',
        'sample.orderedChildren.@each.elements', function() {
            const isEditMode = this.get('selectionMode') === 'edit';
            const selectedModel = this.get('selectedModel');
            const hoveredElement = this.get('hoveredElement');
            if (!hoveredElement) {
                return;
            }

            // if user has manually chosen the edit tool, and selected an annotation, use that ...
            if (selectedModel && isEditMode) {
                return selectedModel;
            }

            // ... otherwise find best match
            const annotations = this.get('sample.orderedAnnotations');
            if (annotations.length) {
                const annotationsToMatch = annotations.slice();
                // if an annotation is selected prefer it
                // add it to the start of the list, sorting preserves order
                if (selectedModel) {
                    annotationsToMatch.removeObject(selectedModel);
                    annotationsToMatch.unshift(selectedModel);
                }
                const hoveredElementPath = elementPath(hoveredElement);
                const possibilities = annotationsToMatch.map(annotation => {
                    const selectorGenerator = BaseSelectorGenerator.create({
                        elements: annotation.get('elements')
                    });
                    let distance = selectorGenerator.generalizationDistance(hoveredElement);
                    if (distance < Infinity && !isEditMode) {
                        // reject annotations with elements that share a container with the
                        // hovered element
                        const annotationPaths = annotation.get('elements').map(elementPath);
                        const containerElements = annotation.get('parent.elements');
                        container: for (let containerElement of containerElements) {
                            const containerPath = elementPath(containerElement);
                            const depth = containerPath.length - 1;
                            for (let annotationPath of annotationPaths) {
                                if (containerElement === annotationPath[depth] &&
                                        containerElement === hoveredElementPath[depth]) {
                                    distance = Infinity;
                                    break container;
                                }
                            }
                        }
                    }
                    return {
                        annotation,
                        distance
                    };
                }).sortBy('distance');
                const {annotation, distance} = possibilities[0];

                // if user has manually chosen the edit tool return the best match, otherwise use
                // a distance cutoff
                if (isEditMode || distance < (selectedModel ? 4 : 2)) {
                    return annotation;
                }
            }
        }),
    hoverOverlayColor: Ember.computed(
        'showHoverOverlay', 'annotationColors.length', 'hoveredModels.firstObject.orderedIndex',
        'generalizableModel.orderedIndex', 'selectedModel.orderedIndex', 'activeSelectionMode',
        function() {
            if (this.get('showHoverOverlay')) {
                const colors = this.getWithDefault('annotationColors', []);
                const activeSelectionMode = this.get('activeSelectionMode');
                if (activeSelectionMode === 'add') {
                    return colors.get('lastObject');
                } else if (activeSelectionMode === 'select' || activeSelectionMode === 'remove') {
                    return colors[this.get('hoveredModels.firstObject.orderedIndex')];
                } else if (activeSelectionMode === 'edit') {
                    return colors[this.get('generalizableModel.orderedIndex')] ||
                        colors[this.get('selectedModel.orderedIndex')];
                }
            }
        }),
    showHoverOverlay: Ember.computed(
        'hoveredElement', 'hoveredModels.[]', 'generalizableModel', 'selectedModel',
        'activeSelectionMode', function() {
            const activeSelectionMode = this.get('activeSelectionMode');
            const hoveredElement = this.get('hoveredElement');
            const hoveredModels = this.get('hoveredModels');
            if (hoveredElement) {
                if (activeSelectionMode === 'add') {
                    return true;
                } else if ((activeSelectionMode === 'select' || activeSelectionMode === 'remove') &&
                        hoveredModels.length) {
                    return true;
                } else if (activeSelectionMode === 'edit' &&
                        (this.get('generalizableModel') || this.get('selectedModel'))) {
                    return true;
                }
            }
            return false;
        }),

    actions: {
        toggleCSS() {
            const browser = this.get('browser');
            if (this.get('cssEnabled')) {
                browser.disableCSS();
            } else {
                browser.enableCSS();
            }
        },

        toggleMagicTool() {
            const magicToolActive = this.get('magicToolActive');
            const selectionMode = this.get('selectionMode');
            if (magicToolActive) {
                this.set('magicToolActive', false);
                if (!selectionMode) {
                    this.set('selectionMode', 'add');
                }
            } else {
                this.setProperties({
                    magicToolActive: true,
                    selectionMode: null
                });
            }
        },

        selectElement() {
            const dispatcher = this.get('dispatcher');
            const magicToolActive = this.get('magicToolActive');
            const selectionMode = this.get('activeSelectionMode');
            const hoveredElement = this.get('hoveredElement');
            const hoveredModels = this.get('hoveredModels');
            const selectedModel = this.get('selectedModel');

            switch (selectionMode) {
                case 'select':
                    if (hoveredModels.length) {
                        const model = hoveredModels[0];
                        dispatcher.selectAnnotationElement(
                            model, hoveredElement, /* redirect = */true);
                    } else {
                        dispatcher.clearSelection();
                    }
                    break;

                case 'add':
                    if (hoveredElement) {
                        dispatcher.addAnnotation(
                            /* auto item */null, hoveredElement, undefined, /* redirect = */true);
                    } else {
                        dispatcher.clearSelection();
                    }
                    break;

                case 'remove':
                    if (selectedModel) {
                        dispatcher.removeAnnotation(selectedModel);
                    } else if (hoveredModels.length) {
                        dispatcher.removeAnnotation(hoveredModels[0]);
                    } else {
                        dispatcher.clearSelection();
                    }
                    break;

                case 'edit':
                    const matchingModel = this.get('generalizableModel') || selectedModel;
                    if (!hoveredElement) {
                        dispatcher.clearSelection();
                    } else if (matchingModel && !hoveredModels.includes(matchingModel)) {
                        dispatcher.addElementToAnnotation(matchingModel, hoveredElement);
                    } else if (hoveredModels.length) {
                        let model;
                        if (selectedModel) {
                            model = selectedModel;
                        } else {
                            model = hoveredModels.find(model =>
                                    (model.get('elements') || []).length > 1) ||
                                hoveredModels[0];
                        }
                        dispatcher.removeElementFromAnnotation(model, hoveredElement);
                    }
                    break;
            }

            if (magicToolActive) {
                this.set('selectionMode', null);
            }
        }
    }
});
