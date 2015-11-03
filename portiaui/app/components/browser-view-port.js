import Ember from 'ember';
import {ANNOTATION_MODE} from '../services/browser';
import {getAttributeList} from './inspector-panel';
import {uniquePathSelectorFromElement, generalizeSelectors} from '../utils/selectors';

function computedOverlayIncludingElement(propertyName) {
    return Ember.computed(propertyName, 'overlays.@each.elements', function() {
        const element = this.get(propertyName);
        return this.get('overlays').find(overlay => overlay.get('elements').includes(element));
    });
}

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    selectorMatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    classNames: ['browser-view-port'],
    // using uiState.models.annotation instead of selectedElement so that observer is triggered
    classNameBindings: ['hoveredElement::none-hovered', 'uiState.models.annotation::none-selected'],

    overlayComponentName: 'hover-overlay',
    hoverSelector: ':hover:not(html):not(body):not(head)',

    activeSelectionMode: Ember.computed(
        'selectionMode', 'magicToolActive',
        'hoveredElement', 'hoveredOverlay', 'selectedElement', 'selectedOverlay',
        'generalizableOverlay', function() {
            const selectedMode = this.get('selectionMode');
            const magicToolActive = this.get('magicToolActive');
            if (selectedMode) {
                return selectedMode;
            } else if (magicToolActive) {
                const hoveredElement = this.get('hoveredElement');
                const hoveredOverlay = this.get('hoveredOverlay');
                const selectedOverlay = this.get('selectedOverlay');
                if (hoveredOverlay) {
                    if (hoveredOverlay === selectedOverlay) {
                        if (selectedOverlay.get('elements.length') === 1) {
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
    hideHoverOverlay: Ember.computed(
        'activeSelectionMode', 'hoveredElement',
        'hoveredOverlay', 'selectedOverlay', 'generalizableOverlay' , function() {
            const selectionMode = this.get('activeSelectionMode');
            const hoveredElement = this.get('hoveredElement');
            const hoveredOverlay = this.get('hoveredOverlay');
            const selectedOverlay = this.get('selectedOverlay');
            const generalizableOverlay = this.get('generalizableOverlay');
            return !hoveredElement || !!hoveredOverlay ||
                selectionMode === 'select' ||
                selectionMode === 'remove' ||
                (selectionMode === 'edit' && !(selectedOverlay || generalizableOverlay));
        }),
    hoveredElement: Ember.computed.alias('uiState.viewPort.hoveredElement'),
    hoveredOverlay: computedOverlayIncludingElement('hoveredElement'),
    hoverOverlayColor: Ember.computed(
        'browserOverlays.hoverOverlayColor', 'activeSelectionMode',
        'selectedOverlay.color', 'generalizableOverlay.color', function() {
            const hoverOverlayColor = this.get('browserOverlays.hoverOverlayColor');
            const selectionMode = this.get('activeSelectionMode');
            const selectedOverlayColor = this.get('selectedOverlay.color') ||
                this.get('generalizableOverlay.color');
            return selectionMode === 'edit' ? selectedOverlayColor : hoverOverlayColor;
        }),
    generalizableAnnotation: Ember.computed(
        'selectedOverlay', 'hoveredElement',
        'uiState.models.sample.orderedAnnotations', function() {
            const selectedOverlay = this.get('selectedOverlay');
            const hoveredElement = this.get('hoveredElement');
            if (!hoveredElement) {
                return;
            }
            let annotations;
            if (selectedOverlay) {
                annotations = [selectedOverlay.get('content')];
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
    selectedOverlay: computedOverlayIncludingElement('selectedElement'),
    selectionMode: Ember.computed.alias('uiState.selectedTools.selectionMode'),
    showToolbar: Ember.computed.equal('browser.mode', ANNOTATION_MODE),

    updateSelectedElement: Ember.observer('uiState.models.annotation.elements', function() {
        const annotation = this.get('uiState.models.annotation');
        if (!annotation) {
            this.set('selectedElement', null);
        } else if (this.get('selectedOverlay.id') !== annotation.get('id')) {
            this.set('selectedElement', annotation.get('elements.firstObject'));
        }
    }),

    updateHoveredElement(elements) {
        const element = elements.get('lastObject');
        this.set('hoveredElement', getAttributeList(element).length ? element : null);
    },

    willInsertElement() {
        this.get('selectorMatcher').register(this.hoverSelector, this, this.updateHoveredElement);
    },

    willDestroyElement() {
        this.get('selectorMatcher').unRegister(this.hoverSelector, this, this.updateHoveredElement);
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
            const hoveredOverlay = this.get('hoveredOverlay');

            switch (selectionMode) {
                case 'select':
                    if (hoveredOverlay) {
                        const annotation = hoveredOverlay.get('content');
                        this.get('dispatcher').selectAnnotationElement(annotation, hoveredElement);
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
                    if (hoveredOverlay) {
                        const annotation = hoveredOverlay.get('content');
                        this.get('dispatcher').removeAnnotation(annotation);
                    } else {
                        this.get('dispatcher').clearSelection();
                    }
                    break;

                case 'edit':
                    const matchingOverlay = this.get('selectedOverlay') ||
                        this.get('generalizableOverlay');
                    if (!hoveredElement) {
                        this.get('dispatcher').clearSelection();
                    } else if (matchingOverlay && matchingOverlay !== hoveredOverlay) {
                        const annotation = matchingOverlay.get('content');
                        this.get('dispatcher').addElementToAnnotation(annotation, hoveredElement);
                    } else if (hoveredOverlay) {
                        const annotation = hoveredOverlay.get('content');
                        this.get('dispatcher').removeElementFromAnnotation(
                            annotation, hoveredElement);
                    }
                    break;
            }

            if (magicToolActive) {
                this.set('selectionMode', null);
            }
        }
    }
});
