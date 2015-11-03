import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    choices: [],
    buttonClass: null,
    menuAlign: 'left',
    menuClass: null,
    menuContainer: null,
    open: false,
    value: null,
    valueAttribute: null,
    viewValue: null,

    didInitAttrs() {
        this.updateViewValue();
    },

    updateViewValue: Ember.observer('open', 'value', function() {
        if (this.get('open')) {
            this.set('viewValue', this.get('value'));
        }
    }),

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
                value,
                viewValue: value
            });
            if (this.attrs.change) {
                this.attrs.change();
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
                    this.setProperties({
                        open: false,
                        value: viewValue
                    });
                    if (this.attrs.change) {
                        this.attrs.change();
                    }
                }
            }
        }
    }
});
