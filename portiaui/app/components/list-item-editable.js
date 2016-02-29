import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['list-item-editable'],
    classNameBindings: ['editing'],

    editing: false,
    onChange: null,
    validate: null,
    spellcheck: true,
    value: null,

    click() {
        if (this.get('editing')) {
            return false;
        }
    },

    actions: {
        startEditing() {
            this.set('editing', true);
        }
    }
});
