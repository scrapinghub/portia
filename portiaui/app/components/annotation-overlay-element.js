import Ember from 'ember';


export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),
    hoveredElement: Ember.inject.service(),

    classNames: ['overlay', 'annotation-overlay'],
    classNameBindings: ['hovered'],

    hovered: Ember.computed('viewPortElement', 'hoveredElement.element', function() {
        return this.get('viewPortElement') === this.get('hoveredElement.element');
    }),

    willInsertElement() {
        this.get('browserOverlays').addElementOverlay(this);
    },

    willDestroyElement() {
        this.get('browserOverlays').removeElementOverlay(this);
    }
});
