import Ember from 'ember';


export default Ember.Component.extend({
    viewPortSelection: Ember.inject.service(),

    classNameBindings: ['groupHovered', 'groupSelected'],

    timerId: null,
    updateInterval: 100,

    // proxied from Annotation in components/data-structure-panel
    color: Ember.computed.alias('overlay.color'),
    elements: Ember.computed.alias('overlay.elements'),
    groupHovered: Ember.computed('elements', 'viewPortSelection.hoveredElement', function() {
        const viewPortSelection = this.get('viewPortSelection.hoveredElement');
        return this.get('elements').some(element => element === viewPortSelection);
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
        const selectedElement = this.get('viewPortSelection.selectedElement');
        const elements = this.get('elements');
        const selectedElementInElements = elements.includes(selectedElement);
        if (groupSelected && !selectedElementInElements) {
            this.set('viewPortSelection.selectedElement', elements[0] || null);
        } else if (!groupSelected && selectedElementInElements) {
            this.set('viewPortSelection.selectedElement', null);
        }
    }),

    scheduleUpdate(delay) {
        this.timerId = Ember.run.later(() => {
            Ember.run.scheduleOnce('sync', this, 'update');
        }, delay);
    },

    update() {
        const viewPortDocument = Ember.$('iframe').contents();
        const currentElements = this.get('elements');
        const newElements = viewPortDocument.find(this.get('selector')).toArray();
        if (Ember.compare(currentElements, newElements) !== 0) {
            this.set('elements', newElements);
        }
        this.scheduleUpdate(this.updateInterval);
    }
});
