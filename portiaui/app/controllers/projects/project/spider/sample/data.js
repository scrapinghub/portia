import Ember from 'ember';
import {getColors} from '../../../../../utils/colors';
import {ElementPath} from '../../../../../utils/selectors';

export default Ember.Controller.extend({
    annotationStructure: Ember.inject.service(),
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    annotationSelectors: [],
    overlayElements: [],
    selectedModelElements: [],

    magicToolActive: Ember.computed.alias('uiState.selectedTools.magicToolActive'),
    hoveredElement: Ember.computed.readOnly('uiState.viewPort.hoveredElement'),
    hoveredModels: Ember.computed.alias('uiState.viewPort.hoveredModels'),
    originalSelectedElement: Ember.computed.alias('uiState.viewPort.originalSelectedElement'),
    sample: Ember.computed.readOnly('model'),
    selectedElement: Ember.computed.alias('uiState.viewPort.selectedElement'),
    selectedModel: Ember.computed.alias('uiState.viewPort.selectedModel'),
    selectionMode: Ember.computed.alias('uiState.selectedTools.selectionMode'),

    activeSelectionMode: Ember.computed(
        'selectionMode', 'magicToolActive',
        'hoveredElement', 'hoveredModels', 'selectedElement', 'selectedModel',
        'selectedModelElements.length',
        'generalizableModel', function() {
            const selectedMode = this.get('selectionMode');
            const magicToolActive = this.get('magicToolActive');
            if (selectedMode) {
                return selectedMode;
            } else if (magicToolActive) {
                const hoveredElement = this.get('hoveredElement');
                const hoveredModels = this.get('hoveredModels');
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
        'selectedModel', 'hoveredElement', 'annotationSelectors', function() {
            const selectedModel = this.get('selectedModel');
            const hoveredElement = this.get('hoveredElement');
            if (!hoveredElement) {
                return;
            }
            let annotationSelectors = this.get('annotationSelectors');
            if (selectedModel) {
                annotationSelectors = annotationSelectors.filterBy('annotation', selectedModel)
                    .concat(annotationSelectors);
            }
            for (let annotationSelector of annotationSelectors) {
                const currentElementPath = annotationSelector.elementPath;
                const hoveredElementPath = new ElementPath(
                    // FIXME: this should be the same as new ElementPath(hoveredElement)
                    new ElementPath(hoveredElement).uniquePathSelector);
                if (currentElementPath.differences(hoveredElementPath) <= 2) {
                    return annotationSelector.annotation;
                }
/*
                hoveredElementPath.add(currentElementPath);
                if (hoveredElementPath.uniquePathSelector.split(/\s*,\s*!/).length ===
                    currentElementPath.uniquePathSelector.split(/\s*,\s*!/).length) {
                    return annotationSelector.annotation;
                }
*/
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
    showHoverOverlay: Ember.computed.bool(
        'hoveredElement', 'hoveredModels.[]', 'generalizableModel', 'selectedModel',
        'activeSelectionMode', function() {
            const activeSelectionMode = this.get('activeSelectionMode');
            const hoveredElement = this.get('hoveredElement');
            const hoveredModels = this.get('hoveredModels');
            if (activeSelectionMode === 'add' && hoveredElement) {
                return true;
            } else if ((activeSelectionMode === 'select' || activeSelectionMode === 'remove') &&
                    hoveredElement && hoveredModels.length) {
                return true;
            } else if (activeSelectionMode === 'edit' &&
                    (this.get('generalizableModel') || this.get('selectedModel'))) {
                return true;
            }
            return false;
        }),

    activate() {
        this.get('browser').setAnnotationMode();
        this.updateAnnotationDefinition();
        this.get('annotationStructure').registerAnnotations(this, this.updateAnnotations);
        this.get('annotationStructure').registerElements(this, this.updateAnnotationElements);
    },

    deactivate() {
        this.get('browser').clearAnnotationMode();
        this.get('annotationStructure').clearDefinition();
        this.get('annotationStructure').unRegisterAnnotations(this, this.updateAnnotations);
        this.get('annotationStructure').unRegisterElements(this, this.updateAnnotationElements);
    },

    updateAnnotations(annotations) {
        this.set('annotationSelectors', annotations);
    },

    updateAnnotationDefinition: Ember.observer('sample.orderedAnnotations.[]', function() {
        const selectorStructure = this.get('sample.items').map(item => ({
            annotation: item,
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
        this.get('annotationStructure').setDefinition(selectorStructure);
    }),

    updateAnnotationElements(elements) {
        this.set('overlayElements', elements);
        this.updateHoveredModels();
        this.updateSelectedModelElements();
    },

    updateHoveredModels: Ember.observer('hoveredElement', function() {
        const models = this.get('annotationStructure').annotationsFor(
                this.get('hoveredElement')) || [];
        this.set('hoveredModels', models);
    }),

    updateSelectedModelElements: Ember.observer('selectedModel', function() {
        const elements = this.get('annotationStructure').elementsFor(
                this.get('selectedModel')) || [];
        this.set('selectedModelElements', elements);
        if (!this.get('selectedElement') && elements[0]) {
            this.set('selectedElement', elements[0]);
        }
    }),

    actions: {
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
            const magicToolActive = this.get('magicToolActive');
            const selectionMode = this.get('activeSelectionMode');
            const hoveredElement = this.get('hoveredElement');
            const hoveredModels = this.get('hoveredModels');

            switch (selectionMode) {
                case 'select':
                    if (hoveredModels.length) {
                        const model = hoveredModels[0];
                        this.get('dispatcher').selectAnnotationElement(
                            model, hoveredElement, /* redirect = */true);
                    } else {
                        this.get('dispatcher').clearSelection();
                    }
                    break;

                case 'add':
                    if (hoveredElement) {
                        this.set('selectedElement', hoveredElement);
                        this.set('originalSelectedElement', hoveredElement);
                        this.get('dispatcher').addAnnotation(
                            /* auto item */null, hoveredElement, undefined, /* redirect = */true);
                    } else {
                        this.get('dispatcher').clearSelection();
                    }
                    break;

                case 'remove':
                    if (hoveredModels.length) {
                        const annotation = hoveredModels[0];
                        this.get('dispatcher').removeAnnotation(annotation);
                    } else {
                        this.get('dispatcher').clearSelection();
                    }
                    break;

                case 'edit':
                    const matchingModel = this.get('generalizableModel') ||
                        this.get('selectedModel');
                    if (!hoveredElement) {
                        this.get('dispatcher').clearSelection();
                    } else if (matchingModel && !hoveredModels.includes(matchingModel)) {
                        this.get('dispatcher').addElementToAnnotation(
                            matchingModel, hoveredElement);
                    } else if (hoveredModels.length) {
                        const annotationStructure = this.get('annotationStructure');
                        const model = hoveredModels.find(model =>
                            (annotationStructure.elementsFor(model) || []).length > 1) ||
                                hoveredModels[0];
                        this.get('dispatcher').removeElementFromAnnotation(
                            model, hoveredElement);
                    }
                    break;
            }

            if (magicToolActive) {
                this.set('selectionMode', null);
            }
        }
    }
});
