import Ember from 'ember';

export default Ember.Component.extend({
    hoveredElement: Ember.inject.service(),

    classNameBindings: ['groupHovered', 'noneHovered'],

    timerId: null,

    // proxied from Annotation in components/data-structure-panel
    color: Ember.computed.alias('overlay.color'),
    elements: Ember.computed.alias('overlay.elements'),
    groupHovered: Ember.computed('elements', 'hoveredElement.element', function() {
        var hoveredElement = this.get('hoveredElement.element');
        return this.get('elements').some(element => element === hoveredElement);
    }),
    noneHovered: Ember.computed.none('hoveredElement.element'),
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

    scheduleUpdate(delay) {
        this.timerId = Ember.run.later(this, this.update, delay);
    },

    update() {
        Ember.run.scheduleOnce('sync', () => {
            var viewPortDocument = Ember.$('iframe').contents();
            var currentElements = this.get('elements');
            var newElements = viewPortDocument.find(this.get('selector')).toArray();
            if (Ember.compare(currentElements, newElements) !== 0) {
                this.set('elements', newElements);
            }
            this.scheduleUpdate(100);
        });
    }
});
