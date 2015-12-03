import Ember from 'ember';
import SelectBox from './select-box';

export default SelectBox.extend({
    autoSelect: false,
    inputClass: null,
    matchQuery: null,
    spellcheck: true,

    init() {
        this._super();
        this.queryChanged = false;
        this.setProperties({
            query: null
        });
    },

    didInsertElement() {
        this.updateFocus();
    },

    inputId: Ember.computed('elementId', function() {
        return this.get('elementId') + '-input';
    }),

    queryOrValue: Ember.computed('open', 'query', 'value', 'valueAttribute', {
        get() {
            if (this.get('open')) {
                return this.get('query');
            } else {
                return this.getValue('value');
            }
        },

        set(key, value) {
            this.queryChanged = true;
            this.set('query', value);
            Ember.run.schedule('afterRender', () => {
                this.queryChanged = false;
            });
            return value;
        }
    }),

    viewValueChanged: Ember.observer('open', 'viewValue', 'valueAttribute', function() {
        if (this.get('open')) {
            if (this.queryChanged) {
                return;
            }

            this.set('query', this.getValue('viewValue'));
        }
    }),

    updateFocus: Ember.observer('open', function() {
        const input = this.getInputElement();
        if (this.get('open')) {
            Ember.run.schedule('afterRender', () => {
                input.focus();
                if (this.get('autoSelect')) {
                    input.select();
                }
            });
        } else {
            Ember.run.schedule('afterRender', () => {
                input.blur();
            });
        }
    }),

    getValue(key) {
        let value = this.get(key);
        const valueAttribute = this.get('valueAttribute');
        if (value && valueAttribute) {
            value = value.get ? value.get(valueAttribute) : value[valueAttribute];
        }
        return value;
    },

    getInputElement() {
        return Ember.$('#' + this.get('inputId'))[0];
    },

    actions: {
        restoreFocus() {
            const queryOrValue = this.get('queryOrValue');
            const input = this.getInputElement();
            const selectionStart = input.selectionStart;
            const selectionEnd = input.selectionEnd;
            const selectionDirection = input.selectionDirection;

            Ember.run.next(() => {
                if (this.get('open')) {
                    input.focus();
                    if (this.get('queryOrValue') === queryOrValue) {
                        input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
                    }
                }
            });
        },

        menuClosed(reason) {
            if (this.get('open')) {
                this.setProperties({
                    open: false,
                    viewValue: this.get('value.content')
                });
            }
        }
    }
});
