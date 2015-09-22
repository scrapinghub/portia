import Ember from 'ember';


export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),

    classNames: ['overlay', 'hover-overlay'],
    classNameBindings: ['hide'],

    backgroundStyle: Ember.computed('color.main', function() {
        var color = this.get('color.main');
        return Ember.String.htmlSafe(color ? `background-color: ${color};` : '');
    }),
    hide: Ember.computed(
        'viewPortElement', 'hoveredOverlay', 'selectedOverlay', 'isSelectionMode', function() {
            const viewPortElement = this.get('viewPortElement');
            const hoveredOverlay = this.get('hoveredOverlay');
            const selectedOverlay = this.get('selectedOverlay');
            const isSelectionMode = this.get('isSelectionMode');
            return !viewPortElement ||
                (isSelectionMode ? hoveredOverlay === selectedOverlay : !!hoveredOverlay);
        }),
    shadowStyle: Ember.computed('color.shadow', function() {
        var color = this.get('color.shadow');
        return Ember.String.htmlSafe(color ? `box-shadow: 0 1px 3px -2px ${color};` : '');
    }),

    willInsertElement() {
        this.get('browserOverlays').addElementOverlay(this);
    },

    willDestroyElement() {
        this.get('browserOverlays').removeElementOverlay(this);
    }
});
