import Ember from 'ember';
import SelectBox from './select-box';

export default SelectBox.extend({
    autoSelect: false,
    inputClass: null,
    spellcheck: true,

    query: Ember.computed('open', 'viewValue', 'valueAttribute', {
        get() {
            return this.getValueAttribute(this.get('viewValue'));
        },

        set(key, value) {
            Ember.run.scheduleOnce('afterRender', this, this.updateViewValue);
            return value;
        }
    }),

    setInputFocus(ignoreAutoSelect = false) {
        const inputElement = Ember.$('#' + this.get('inputId')).get(0);
        if (inputElement && this.get('open')) {
            inputElement.focus();
            if (!ignoreAutoSelect && this.get('autoSelect')) {
                inputElement.select();
            }
        } else if (!this.get('isDestroying')) {
            inputElement.blur();
        }
    },

    getValueAttribute(value) {
        const valueAttribute = this.get('valueAttribute');
        if (value && valueAttribute) {
            value = value.get ? value.get(valueAttribute) : value[valueAttribute];
        }
        return value;
    },

    updateViewValue() {
        const query = this.get('query');
        let items = [];
        this.trigger('getMenuItems', items);

        if (this.orderItemsForSearch) {
            items = this.orderItemsForSearch(items);
        }

        const currentValue = this.getValueAttribute(this.get('viewValue'));
        if (currentValue !== query) {
            let item = items.find(item => {
                return this.getValueAttribute(item.get('value')) === query;
            });
            if (!item && !currentValue.startsWith(query)) {
                item = items.find(item => {
                    return this.getValueAttribute(item.get('value')).startsWith(query);
                });
            }
            if (item) {
                this.set('viewValue', item.get('value'));
            }
        }
    },

    actions: {
        restoreFocus() {
            if (this.get('open')) {
                Ember.run.next(this, this.setInputFocus, /* ignoreAutoSelect = */true);
            }
        }
    }
});
