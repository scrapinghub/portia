import Ember from 'ember';
import {ANNOTATION_MODE} from '../services/browser';
import {getAttributeList} from './inspector-panel';


const HoverSelector = Ember.Object.extend({
    selector: ':hover:not(html):not(body):not(head)',
    _elements: [],

    element: Ember.computed.alias('parent.hoveredElement'),
    elements: Ember.computed('_elements', {
        get() {
            return this.getWithDefault('_elements', []);
        },

        set(key, value) {
            const element = value.get('lastObject');
            this.setProperties({
                element: getAttributeList(element).length ? element : null,
                _elements: value
            });
            return value;
        }
    })
});

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

    activeSelectionMode: Ember.computed(
        'selectionMode', 'magicToolActive',
        'hoveredElement', 'hoveredOverlay', 'selectedElement', 'selectedOverlay', function() {
            const selectedMode = this.get('selectionMode');
            const magicToolActive = this.get('magicToolActive');
            if (selectedMode) {
                return selectedMode;
            } else if (magicToolActive) {
                const hoveredElement = this.get('hoveredElement');
                const hoveredOverlay = this.get('hoveredOverlay');
                const selectedOverlay = this.get('selectedOverlay');
                //TODO: detect edit mode
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
                    return 'add';
                }
                return 'select';
            }
        }),
    hideHoverOverlay: Ember.computed(
        'activeSelectionMode', 'hoveredElement', 'hoveredOverlay', 'selectedOverlay', function() {
            const selectionMode = this.get('activeSelectionMode');
            const hoveredElement = this.get('hoveredElement');
            const hoveredOverlay = this.get('hoveredOverlay');
            const selectedOverlay = this.get('selectedOverlay');
            return !hoveredElement || !!hoveredOverlay ||
                selectionMode === 'select' ||
                selectionMode === 'remove' ||
                (selectionMode === 'edit' && !selectedOverlay);
        }),
    hoveredElement: Ember.computed.alias('uiState.viewPort.hoveredElement'),
    hoveredOverlay: computedOverlayIncludingElement('hoveredElement'),
    hoverOverlayColor: Ember.computed(
        'browserOverlays.hoverOverlayColor', 'activeSelectionMode',
        'selectedOverlay.color', function() {
            const hoverOverlayColor = this.get('browserOverlays.hoverOverlayColor');
            const selectionMode = this.get('activeSelectionMode');
            const selectedOverlayColor = this.get('selectedOverlay.color');
            return selectionMode === 'edit' ? selectedOverlayColor : hoverOverlayColor;
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

    willInsertElement() {
        this.hoverSelector = HoverSelector.create({
            parent: this
        });
        this.get('selectorMatcher').register(this.hoverSelector);
    },

    willDestroyElement() {
        this.get('selectorMatcher').unregister(this.hoverSelector);
        this.hoverSelector.destroy();
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
            const selectedOverlay = this.get('selectedOverlay');

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
                        this.get('dispatcher').addAnnotation(hoveredElement);
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
                    if (!hoveredElement) {
                        this.get('dispatcher').clearSelection();
                    } else if (selectedOverlay && selectedOverlay !== hoveredOverlay) {
                        const annotation = selectedOverlay.get('content');
                        this.get('dispatcher').addElementToAnnotation(annotation, hoveredElement);
                    } else if (hoveredOverlay) {
                        const annotation = hoveredOverlay.get('content');
                        this.get('dispatcher').removeElementFromAnnotation(
                            annotation, hoveredElement);
                    } else {
                        //TODO: detect possible match
                    }
                    break;
            }

            if (magicToolActive) {
                this.set('selectionMode', null);
            }
        }
    }
});
