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
    routing: Ember.inject.service('-routing'),
    selectorMatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    classNames: ['browser-view-port'],
    // using uiState.models.annotation instead of selectedElement so that observer is triggered
    classNameBindings: ['hoveredElement::none-hovered', 'uiState.models.annotation::none-selected'],

    overlayComponentName: 'hover-overlay',

    hoveredElement: Ember.computed.alias('uiState.viewPort.hoveredElement'),
    hoveredOverlay: computedOverlayIncludingElement('hoveredElement'),
    overlays: Ember.computed.readOnly('browserOverlays.overlayComponents'),
    selectedElement: Ember.computed.alias('uiState.viewPort.selectedElement'),
    selectedOverlay: computedOverlayIncludingElement('selectedElement'),

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
        viewPortClick() {
            if (this.get('browser.mode') !== ANNOTATION_MODE) {
                return;
            }

            const hoveredElement = this.get('hoveredElement');
            const hoveredOverlay = this.get('hoveredOverlay');
            const selectedOverlay = this.get('selectedOverlay');
            this.set('selectedElement', hoveredElement);
            if (hoveredOverlay) {
                if (hoveredOverlay !== selectedOverlay) {
                    const routing = this.get('routing');
                    const models = [hoveredOverlay.get('id')];
                    routing.transitionTo(
                        'projects.project.spider.sample.annotation', models, {}, true);
                }
            } else {
                if (!hoveredElement) {
                    const routing = this.get('routing');
                    routing.transitionTo('projects.project.spider.sample', [], {}, true);
                }
            }
        }
    }
});
