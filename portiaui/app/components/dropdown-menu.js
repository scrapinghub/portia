import Ember from 'ember';

function computedItem(propertyName) {
    const cachePropertyName = `_${propertyName}ItemCache`;

    return Ember.computed(propertyName, 'items', {
        get() {
            let cachedItem = this[cachePropertyName];
            const value = this.get(propertyName);
            let items = this.get('items');
            if (!cachedItem || !items.includes(cachedItem) ||
                    cachedItem.get('value') !== value) {
                if (this.orderItemsForSearch) {
                    items = this.orderItemsForSearch(items);
                }
                const equalityFn = this.valuesEqual || Ember.isEqual;
                this[cachePropertyName] = cachedItem =
                    items.find(item => equalityFn(item.get('value'), value));
            }
            return cachedItem;
        },

        set(key, item) {
            this[cachePropertyName] = item;
            this.set(propertyName, item.get('value'));
            return item;
        }
    });
}

export default Ember.Component.extend({
    tagName: 'ul',
    attributeBindings: ['tabindex'],
    classNames: ['dropdown-menu'],

    active: null,
    focused: null,
    keyNavigate: 'active',
    tabindex: -1,

    items: Ember.computed(function() {
        if (!this.element) {
            return [];
        }
        const items = [];
        for (let child of this.element.children) {
            const item = this.itemsMap.get(child.id);
            if (item) {
                items.push(item);
            }
        }
        return items;
    }).volatile(),

    activeItem: computedItem('active'),
    focusedItem: computedItem('focused'),

    init() {
        this._super();
        this.itemsMap = new Map();
        this.getWithDefault('events', this)
            .on('menuKeyDown', this, this.keyDown)
            .on('getMenuItems', result => {
                result.push(...this.get('items'));
            });
    },


    next(type) {
        type = this.validateType(type);
        const items = this.get('items');
        let item = this.get(`${type}Item`);
        const startIndex = items.indexOf(item);
        let index = startIndex;
        do {
            if (!~index) {
                index = 0;
            } else {
                index++;
            }
            index = (index + items.length) % items.length;
            item = items[index];
        } while (item.get('disabled') && index !== startIndex);
        if (index !== startIndex) {
            this.set(`${type}Item`, item);
        }
    },

    previous(type) {
        type = this.validateType(type);
        const items = this.get('items');
        let item = this.get(`${type}Item`);
        const startIndex = items.indexOf(item);
        let index = startIndex;
        do {
            if (!~index) {
                index = -1;
            } else {
                index--;
            }
            index = (index + items.length) % items.length;
            item = items[index];
        } while (item.get('disabled') && index !== startIndex);
        if (index !== startIndex) {
            this.set(`${type}Item`, item);
        }
    },

    triggerAction(type) {
        type = this.validateType(type);
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
        if (this.attrs.onFocusIn) {
            this.attrs.onFocusIn(...arguments);
        }
    },

    focusOut() {
        if (this.attrs.onFocusOut) {
            this.attrs.onFocusOut(...arguments);
        }
    },

    keyDown() {
        this.send('keyDown', ...arguments);
    },

    registerItem(item) {
        this.itemsMap.set(item.get('elementId'), item);
        Ember.run.scheduleOnce('afterRender', this, this.updateItems);
    },

    unRegisterItem(item) {
        this.itemsMap.delete(item.get('elementId'));
        Ember.run.scheduleOnce('afterRender', this, this.updateItems);
    },

    updateItems() {
        if (!this.get('isDestroying')) {
            this.notifyPropertyChange('items');
        }
    },

    orderItemsForSearch(items) {
        return items;
    },

    valuesEqual(a, b) {
        return Ember.isEqual(a, b);
    },

    actions: {
        keyDown($event) {
            const keyNavigate = this.get('keyNavigate');
            switch ($event.keyCode) {
                case 13:  // ENTER
                    if (!this.triggerAction(keyNavigate)) {
                        return;
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

            $event.preventDefault();
            $event.stopPropagation();
        }
    }
});
