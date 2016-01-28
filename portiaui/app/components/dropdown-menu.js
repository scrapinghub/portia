import Ember from 'ember';
import {attrChanged, attrChangedTo} from '../utils/attrs';

export default Ember.Component.extend({
    tagName: 'ul',
    attributeBindings: ['tabindex'],
    classNames: ['dropdown-menu'],

    active: null,
    activeQuery: null,
    focusMenu: false,
    focused: null,
    focusedQuery: null,
    keyNavigate: 'active',
    matchQuery: null,
    tabindex: -1,

    init() {
        this._super();
        this.items = new Map();
        this.orderedItems = [];
        this.setProperties({
            activeItem: null,
            focusedItem: null
        });
    },

    didReceiveAttrs({oldAttrs, newAttrs}) {
        if (attrChanged(oldAttrs, newAttrs, 'activeQuery')) {
            Ember.run.schedule('sync', this, this.updateCurrentItemFromQuery, 'active');
        } else if (attrChanged(oldAttrs, newAttrs, 'active')) {
            Ember.run.schedule('sync', this, this.updateCurrentItem, 'active');
        }
        if (attrChanged(oldAttrs, newAttrs, 'focusedQuery')) {
            Ember.run.schedule('sync', this, this.updateCurrentItemFromQuery, 'focused');
        } else if (attrChanged(oldAttrs, newAttrs, 'focused')) {
            Ember.run.schedule('sync', this, this.updateCurrentItem, 'focused');
        }
        if (attrChangedTo(oldAttrs, newAttrs, 'focusMenu', true)) {
            Ember.run.next(() => {
                this.element.focus();
            });
        }
    },

    didInsertElement() {
        const registerWith = this.get('register-with');
        const registerAs = this.get('register-as') || 'dropdown';
        if (registerWith) {
            registerWith.set(registerAs, this);
        }
    },

    willDestroyElement() {
        const registerWith = this.get('register-with');
        const registerAs = this.get('register-as') || 'dropdown';
        if (registerWith) {
            registerWith.set(registerAs, null);
        }
    },

    updateCurrent(type) {
        const item = this.get(`${type}Item`);
        this.set(type, item && item.get('value'));
    },

    updateCurrentItem(type) {
        const current = this.get(type);
        const currentItem = this.orderedItems.findBy('value', current);
        this.set(`${type}Item`, currentItem);
    },

    updateCurrentItemFromQuery(type) {
        const currentQuery = this.get(`${type}Query`);
        const matchQuery = this.get('matchQuery');
        const currentItem = this.orderedItems.find(item => {
            const value = item.get('value');
            if (matchQuery) {
                return matchQuery(value, currentQuery);
            }
            return value && value.includes && value.includes(currentQuery);
        });

        if (currentItem) {
            this.set(`${type}Item`, currentItem);
            this.updateCurrent(type);
        }
    },

    next(type) {
        let item = this.get(`${type}Item`);
        const startIndex = this.orderedItems.indexOf(item);
        let index = startIndex;
        do {
            if (!~index) {
                index = 0;
            } else {
                index++;
            }
            index = (index + this.orderedItems.length) % this.orderedItems.length;
            item = this.orderedItems[index];
        } while (item.get('disabled') && index !== startIndex);
        if (index !== startIndex) {
            this.set(`${type}Item`, item);
            this.updateCurrent(type);
        }
    },

    previous(type) {
        let item = this.get(`${type}Item`);
        const startIndex = this.orderedItems.indexOf(item);
        let index = startIndex;
        do {
            if (!~index) {
                index = -1;
            } else {
                index--;
            }
            index = (index + this.orderedItems.length) % this.orderedItems.length;
            item = this.orderedItems[index];
        } while (item.get('disabled') && index !== startIndex);
        if (index !== startIndex) {
            this.set(`${type}Item`, item);
            this.updateCurrent(type);
        }
    },

    triggerAction(type) {
        const currentItem = this.get(`${type}Item`);
        if (currentItem) {
            currentItem.send('performAction');
        }
        return !!currentItem;
    },

    validateType(type, fallback) {
        if (!fallback) {
            fallback = this.validateType(this.get('keyNavigate'), 'active');
        }
        return (type === 'active' || type === 'focused') ? type : fallback;
    },

    focusIn() {
        if (this.attrs['focus-in']) {
            this.attrs['focus-in'](...arguments);
        }
    },

    focusOut() {
        if (this.attrs['focus-out']) {
            this.attrs['focus-out'](...arguments);
        }
    },

    keyDown() {
        this.send('keyDown', ...arguments);
    },

    registerItem(item) {
        this.items.set(item.get('elementId'), item);
        Ember.run.scheduleOnce('afterRender', this, this.updateItems);
    },

    unRegisterItem(item) {
        this.items.delete(item.get('elementId'));
        if (!this.get('isDestroying')) {
            Ember.run.scheduleOnce('afterRender', this, this.updateItems);
        }
    },

    updateItems() {
        const domItems = this.$('.dropdown-item').toArray();
        this.orderedItems = domItems.mapBy('id').map((id) => this.items.get(id));
        this.updateCurrentItem('active');
        this.updateCurrentItem('focused');
    },

    actions: {
        keyDown(event) {
            const keyNavigate = this.get('keyNavigate');
            switch (event.keyCode) {
                case 13:  // ENTER
                    if (!this.triggerAction(keyNavigate)) {
                        return;
                    }
                    break;
                case 27:  // ESCAPE
                    if (this.attrs.escape) {
                        this.attrs.escape();
                    }
                    break;
                case 38:  // UP
                    this.previous(keyNavigate);
                    break;
                case 40:  // DOWN
                    this.next(keyNavigate);
                    break;
                default:
                    return;
            }

            event.preventDefault();
            event.stopPropagation();
        }
    }
});
