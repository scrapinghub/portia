import Ember from 'ember';


export const ICON_CLASSES = {
    select: 'fa fa-mouse-pointer',
    add: 'fa fa-plus',
    remove: 'fa fa-minus',
    edit: 'fa fa-th-large'
};

export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),

    classNames: ['overlay'],

    backgroundStyle: Ember.computed('color.main', function() {
        const color = this.get('color.main');
        return Ember.String.htmlSafe(color ? `background-color: ${color};` : '');
    }),
    iconClasses: Ember.computed('icon', function() {
        const icon = this.get('icon');
        return ICON_CLASSES[icon] || 'hide';
    }),
    shadowStyle: Ember.computed('color.shadow', function() {
        const color = this.get('color.shadow');
        return Ember.String.htmlSafe(color ? `box-shadow: 0 1px 3px -2px ${color};` : '');
    }),
    textShadowStyle: Ember.computed('color.shadow', function() {
        const color = this.get('color.shadow');
        return Ember.String.htmlSafe(color ? `text-shadow: 0 1px 1px ${color};` : '');
    }),

    willInsertElement() {
        this.get('browserOverlays').addElementOverlay(this);
    },

    willDestroyElement() {
        this.get('browserOverlays').removeElementOverlay(this);
    }
});
