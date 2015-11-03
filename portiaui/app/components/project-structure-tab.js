import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['project-structure-tab', 'dropdown'],
    classNameBindings: ['open'],

    open: false,

    actions: {
        closeDropdown() {
            this.set('open', false);
        },

        toggleDropdown() {
            this.toggleProperty('open');
        }
    }
});
