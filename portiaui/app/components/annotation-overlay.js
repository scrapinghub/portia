import Ember from 'ember';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    uiState: Ember.inject.service(),

    classNameBindings: ['groupHovered', 'groupSelected'],

    timerId: null,
    updateInterval: 100,

    // proxied from Annotation in components/data-structure-panel
    color: Ember.computed.alias('overlay.color'),
    elements: Ember.computed.alias('overlay.elements'),
    groupHovered: Ember.computed('elements', 'uiState.viewPort.hoveredElement', function() {
        const hoveredElement = this.get('uiState.viewPort.hoveredElement');
        return this.get('elements').some(element => element === hoveredElement);
    }),
    groupSelected: Ember.computed.readOnly('overlay.isCurrentAnnotation'),
    selector: Ember.computed.alias('overlay.selector'),

    willInsertElement() {
        this.scheduleUpdate(1);
    },

    willDestroyElement() {
        if (this.timerId !== null) {
            Ember.run.cancel(this.timerId);
            this.timerId = null;
        }
        this.set('elements', []);
    },

    initSelectedElement: Ember.observer('groupSelected', 'elements', function() {
        const groupSelected = this.get('groupSelected');
        const selectedElement = this.get('uiState.viewPort.selectedElement');
        const elements = this.get('elements');
        const selectedElementInElements = elements.includes(selectedElement);
        if (groupSelected && !selectedElementInElements) {
            this.set('uiState.viewPort.selectedElement', elements[0] || null);
        } else if (!groupSelected && selectedElementInElements) {
            this.set('uiState.viewPort.selectedElement', null);
        }
    }),

    scheduleUpdate(delay) {
        this.timerId = Ember.run.later(() => {
            Ember.run.scheduleOnce('sync', this, 'update');
        }, delay);
    },

    update() {
        const $document = this.get('browser.$document');
        if ($document) {
            const currentElements = this.get('elements');
            const newElements = $document.find(this.get('selector')).toArray();
            if (Ember.compare(currentElements, newElements) !== 0) {
                this.set('elements', newElements);
            }
        }
        this.scheduleUpdate(this.updateInterval);
    }
});
