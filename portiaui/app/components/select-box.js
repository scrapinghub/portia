import Ember from 'ember';

export default Ember.Component.extend({
    open: false,

    didInsertElement() {
        const $button = this.$('button');

        Ember.run.schedule('afterRender', () => {
            $button.on({
                focusout: () => {
                    Ember.run.later(() => {
                        if (!this.isDestroyed) {
                            this.set('open', false);
                        }
                    }, 100);
                },
                keyup: (event) => {
                    if (event.keyCode === 27) {
                        Ember.run.next(() => {
                            this.set('open', false);
                        });
                    }
                }
            });
            if (this.get('open')) {
                $button.focus();
            }
        });
    },

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
