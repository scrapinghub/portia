import Ember from 'ember';
import { shortGuid } from '../utils/utils';

export default Ember.Component.extend({
    tagName: '',

    choices: [],
    buttonClass: null,
    menuAlign: 'left',
    menuClass: null,
    menuContainer: null,
    name: null,
    open: false,
    value: null,
    valueAttribute: null,
    isDisabled: false,

    viewValue: Ember.computed('value', {
        get() {
            return this.get('value');
        },

        set(key, value) {
            return value;
        }
    }),

    init() {
        this._super(...arguments);
        this.set('inputId', `${shortGuid()}-input`);
    },

    didInsertElement() {
        if (this.get('open')) {
            Ember.run.next(this, this.setInputFocus);
        }
    },

    updateInputFocus: Ember.observer('open', function() {
        Ember.run.scheduleOnce('afterRender', this, this.setInputFocus);
    }),

    setInputFocus() {
        const inputElement = Ember.$('#' + this.get('inputId')).get(0);
        if (inputElement && this.get('open')) {
            inputElement.focus();
        } else if (!this.get('isDestroying')) {
            inputElement.blur();
        }
    },

    actions: {
        setViewValue(value) {
            this.set('viewValue', value);
        },

        setValue(value) {
            this.setProperties({
                value,
                viewValue: value
            });
        },

        setValueAndClose(value) {
            this.setProperties({
                open: false,
                value
            });
            if (this.attrs.onChange) {
                this.attrs.onChange();
            }
        },

        menuClicked() {
            const action = this.get('onClick');

            if (action) {
                action();
            }
        },

        menuClosed(reason) {
            if (this.get('open')) {
                if (reason === 'escape') {
                    this.setProperties({
                        open: false,
                        viewValue: this.get('value')
                    });
                } else {
                    const viewValue = this.get('viewValue');
                    if (viewValue && viewValue.onMenuClosed && viewValue.onMenuClosed.call) {
                        viewValue.onMenuClosed();
                    } else {
                        this.setProperties({
                            open: false,
                            value: viewValue
                        });
                    }
                    if (this.attrs.onChange) {
                        this.attrs.onChange();
                    }
                }
            }
        }
    }
});
