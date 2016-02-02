import Ember from 'ember';

export default Ember.Component.extend({
    type: 'text',
    value: '',
    classNames: 'input-group',

    actions: {
        clear() {
            this.set('value', '');
            this.attrs.clear()
        },

        keyUp(value) {
            this.update(this.get('value'));
        }
    }
});
