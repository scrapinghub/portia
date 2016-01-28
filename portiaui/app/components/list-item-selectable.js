import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['list-item-selectable'],
    classNameBindings: ['selecting'],

    change: null,
    choices: [],
    buttonClass: null,
    menuAlign: 'left',
    menuClass: null,
    menuContainer: null,

    selecting: false,
    value: null,

    actions: {
        startSelecting() {
            this.set('selecting', true);
        }
    }
});
