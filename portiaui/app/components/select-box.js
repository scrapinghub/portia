import Ember from 'ember';

export default Ember.Component.extend({
    open: false,

    onClose: Ember.observer('open', function() {
        if (!this.get('open')) {
            const close = this.get('close');
            if (close) {
                close(this.get('value'));
            }
        }
    }),

    actions: {
        close() {
            this.set('open', false);
        },

        setValue(value) {
            this.setProperties({
                open: false,
                value: value
            });
            const change = this.get('change');
            if (change) {
                change(value);
            }
        },

        toggleDropdown() {
            this.toggleProperty('open');
        }
    }
});
