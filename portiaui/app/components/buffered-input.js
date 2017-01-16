import Ember from 'ember';
import { ensurePromise } from '../utils/promises';
import { shortGuid } from '../utils/utils';

export default Ember.Component.extend({
    tagName: '',

    autofocus: false,
    autoSelect: false,
    focused: false,
    spellcheck: true,
    type: 'text',
    value: null,
    viewValue: null,

    init() {
        this._super(...arguments);
        this.set('inputId', `${shortGuid()}-input`);
    },

    didInsertElement() {
        if (this.get('focused')) {
            Ember.run.schedule('afterRender', () => {
                this.send('startEditing');
            });
            Ember.run.next(this, this.setInputFocus);
        }
        // Prevent default / bubbling of keypress event when pressing enter
        Ember.$('#' + this.get('inputId'))
             .keypress((e) => e.which !== 13);
    },

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

    updateInputFocus: Ember.observer('focused', function() {
        Ember.run.scheduleOnce('afterRender', this, this.setInputFocus);
    }),

    setInputFocus() {
        const inputElement = Ember.$('#' + this.get('inputId')).get(0);
        if (inputElement && this.get('focused')) {
            inputElement.focus();
            if (this.get('autoSelect')) {
                inputElement.select();
            }
        } else {
            if (!this.get('isDestroying')) {
                inputElement.blur();
            }
        }
    },

    validateName(name) {
        return typeof this.attrs.validate !== 'function' || this.attrs.validate(name);
    },

    actions: {
        startEditing() {
            this.setProperties({
                focused: true,
                viewValue: this.get('value')
            });
        },

        cancelEditing() {
            this.setProperties({
                focused: false,
                viewValue: null
            });
        },

        endEditing(reason) {
            const value = this.get('viewValue');
            ensurePromise(this.validateName(value)).then(isValid => {
                if (!isValid) {
                    Ember.run.next(this, this.setInputFocus);
                } else {
                    this.setProperties({
                        focused: false,
                        value: value,
                        viewValue: null
                    });
                    if (reason === 'enter' && this.attrs.onEnterPress &&
                            this.attrs.onEnterPress.call) {
                        this.attrs.onEnterPress(value);
                    }
                    if (this.attrs.onChange && this.attrs.onChange.call) {
                        this.attrs.onChange(value);
                    }
                }
            });
        }
    }
});
