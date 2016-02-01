import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['dropdown-item'],
    classNameBindings: ['active', 'focused', 'disabled'],

    disabled: false,
    menu: null,
    value: null,

    active: Ember.computed('menu.activeItem', function() {
        return this.get('menu.activeItem') === this;
    }),
    focused: Ember.computed('menu.focusedItem', function() {
        return this.get('menu.focusedItem') === this;
    }),

    didInsertElement() {
        const menu = this.get('menu');
        if (menu) {
            menu.registerItem(this);
        }
    },

    willDestroyElement() {
        const menu = this.get('menu');
        if (menu) {
            menu.unRegisterItem(this);
        }
    },

    actions: {
        performAction(value) {
            if (this.attrs.action && !this.get('disabled')) {
                this.attrs.action(value);
            }
        }
    }
});
