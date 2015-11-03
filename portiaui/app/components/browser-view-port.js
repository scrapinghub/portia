import Ember from 'ember';
import {ANNOTATION_MODE} from '../services/browser';
import {getAttributeList} from './inspector-panel';
import {uniquePathSelectorFromElement, generalizeSelectors} from '../utils/selectors';

export default Ember.Component.extend({
    annotationStructure: Ember.inject.service(),
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    selectorMatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    classNames: ['browser-view-port'],
    classNameBindings: ['hoveredElement::none-hovered', 'selectedElement::none-selected'],

    hoverSelector: ':hover:not(html):not(body):not(head)',
    overlayComponentName: 'hover-overlay',
    overlayElements: [],
    selectedModelElements: [],

    activeSelectionMode: Ember.computed(
        'selectionMode', 'magicToolActive',
        'hoveredElement', 'hoveredModels', 'selectedElement', 'selectedModel',
        'generalizableOverlay', function() {
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
                    if (this.get('generalizableOverlay')) {
                        return 'edit';
                    }
                    return 'add';
                }
                return 'select';
            }
        }),
    hoveredElement: Ember.computed.alias('uiState.viewPort.hoveredElement'),
    hoveredModels: Ember.computed.alias('uiState.viewPort.hoveredModels'),
    hoverOverlayColor: Ember.computed(
        'browserOverlays.hoverOverlayColor', 'activeSelectionMode',
        'selectedModel.color', 'generalizableOverlay.color', function() {
            const hoverOverlayColor = this.get('browserOverlays.hoverOverlayColor');
            const selectionMode = this.get('activeSelectionMode');
            const selectedOverlayColor = this.get('selectedModel.color') ||
                this.get('generalizableOverlay.color');
            return selectionMode === 'edit' ? selectedOverlayColor : hoverOverlayColor;
        }),
    generalizableAnnotation: Ember.computed(
        'selectedModel', 'hoveredElement',
        'uiState.models.sample.orderedAnnotations', function() {
            const selectedModel = this.get('selectedModel');
            const hoveredElement = this.get('hoveredElement');
            if (!hoveredElement) {
                return;
            }
            let annotations;
            if (selectedModel) {
                annotations = [selectedModel];
            } else {
                annotations = this.get('uiState.models.sample.orderedAnnotations');
                //return;
            }
            for (let annotation of annotations) {
                const currentSelector = annotation.get('generalizedSelector');
                const accept = annotation.get('acceptSelectors').slice();
                const reject = annotation.get('rejectSelectors').slice();
                const selector = uniquePathSelectorFromElement(hoveredElement);
                accept.addObject(selector);
                reject.removeObject(selector);
                const possibleSelector = generalizeSelectors(accept, reject);
                if (currentSelector.split(/\s*,\s*/).length ===
                    possibleSelector.split(/\s*,\s*/).length) {
                    return annotation;
                }
            }
        }),
    generalizableOverlay: Ember.computed(
        'generalizableAnnotation.id', 'overlays.@each.id', function() {
            const annotationId = this.get('generalizableAnnotation.id');
            return this.get('overlays').findBy('id', annotationId);
        }),
    magicToolActive: Ember.computed.alias('uiState.selectedTools.magicToolActive'),
    overlays: Ember.computed.readOnly('browserOverlays.overlayComponents'),
    selectedElement: Ember.computed.alias('uiState.viewPort.selectedElement'),
    selectedModel: Ember.computed.alias('uiState.viewPort.selectedModel'),
    selectionMode: Ember.computed.alias('uiState.selectedTools.selectionMode'),
    showToolbar: Ember.computed.equal('browser.mode', ANNOTATION_MODE),

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

    willInsertElement() {
        this.get('selectorMatcher').register(this.hoverSelector, this, this.updateHoveredElement);
        this.get('annotationStructure').register(this, this.updateAnnotationElements);
    },

    willDestroyElement() {
        this.get('selectorMatcher').unRegister(this.hoverSelector, this, this.updateHoveredElement);
        this.get('annotationStructure').unRegister(this, this.updateAnnotationElements);
    },

    updateHoveredElement(elements) {
        const element = elements.get('lastObject');
        this.set('hoveredElement', getAttributeList(element).length ? element : null);
    },

    updateAnnotationElements(elements) {
        this.set('overlayElements', elements);
        this.updateHoveredModels();
        this.updateSelectedModelElements();
    },

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

        viewPortClick() {
            if (this.get('browser.mode') !== ANNOTATION_MODE) {
                return;
            }

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
                        const item = this.get('uiState.models.sample.items.firstObject');
                        this.get('dispatcher').addAnnotation(
                            item, hoveredElement, undefined, /* redirect = */true);
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
                    const matchingModel = this.get('selectedModel') ||
                        this.get('generalizableOverlay');
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
