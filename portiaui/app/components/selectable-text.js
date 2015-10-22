import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['selectable-text'],

    choices: [],
    focus: true,
    dropdownAlign: 'left',
    selecting: false,

    actions: {
        startSelecting() {
            this.set('selecting', true);
        },

        endSelecting() {
            this.set('selecting', false);
            if (this.attrs.save) {
                this.attrs.save();
            }
        },

        cancelSelecting() {
            this.set('selecting', false);
            if (this.attrs.cancel) {
                this.attrs.cancel();
            }
        }
    }
});
