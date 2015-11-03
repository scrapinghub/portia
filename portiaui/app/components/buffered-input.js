import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    autofocus: false,
    autoSelect: false,
    focused: false,
    spellcheck: true,
    type: 'text',
    value: null,
    viewValue: null,

    didInsertElement() {
        if (this.get('focused')) {
            this.send('startEditing');
        }
    },

    inputId: Ember.computed('elementId', function() {
        return this.get('elementId') + '-input';
    }),

    displayedValue: Ember.computed('value', 'viewValue', 'focused', {
        get() {
            if (this.get('focused')) {
                return this.get('viewValue');
            } else {
                return this.get('value');
            }
        },

        set(key, value, cachedValue) {
            if (this.get('focused')) {
                this.set('viewValue', value);
                return value;
            } else {
                return cachedValue;
            }
        }
    }),

    getInputElement() {
        return Ember.$('#' + this.get('inputId'))[0];
    },

    actions: {
        startEditing() {
            this.setProperties({
                focused: true,
                viewValue: this.get('value')
            });
            Ember.run.schedule('afterRender', () => {
                const input = this.getInputElement();
                input.focus();
                if (this.get('autoSelect')) {
                    input.select();
                }
            });
        },

        cancelEditing() {
            if (this.get('focused')) {
                this.setProperties({
                    focused: false,
                    viewValue: null
                });
                Ember.run.schedule('afterRender', () => {
                    this.getInputElement().blur();
                });
            }
        },

        endEditing(reason) {
            if (this.get('focused')) {
                this.setProperties({
                    focused: false,
                    value: this.get('viewValue'),
                    viewValue: null
                });
                Ember.run.schedule('afterRender', () => {
                    this.getInputElement().blur();
                });
                if (reason === 'enter' && this.attrs.enter) {
                    this.attrs.enter();
                }
                if (this.attrs.change) {
                    this.attrs.change();
                }
            }
        }
    }
});
