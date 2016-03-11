import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['input-group', 'input-with-clear'],

    type: 'text',
    value: '',

    actions: {
        clear() {
            this.set('value', '');
            this.attrs.clear();
        },

        keyUp() {
            this.update(this.get('value'));
        }
    }
});
