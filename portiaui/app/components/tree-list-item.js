import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['tree-list-item'],
    classNameBindings: ['active', 'childActive', 'collapsed'],

    active: false,
    childActive: false,
    hasChildren: false,

    collapsed: Ember.computed('_collapsed', {
        get() {
            return this.get('_collapsed');
        },

        set(key, value, cachedValue) {
            return cachedValue;
        }
    }),

    updateEverOpened: Ember.observer('collapsed', function() {
        if (!this.get('collapsed')) {
            this.set('everOpened', true);
        }
    }),

    init() {
        this._super();
        this.set('_collapsed', null);
        this.set('everOpened', false);
    },

    didReceiveAttrs({oldAttrs, newAttrs}) {
        if (newAttrs.collapsed === false) {
            this.set('_collapsed', false);
        } else if (this.get('_collapsed') === null) {
            this.set('_collapsed', newAttrs.collapsed);
        }
    },

    actions: {
        openCollapsed() {
            this.set('_collapsed', false);
        },

        toggleCollapsed() {
            this.toggleProperty('_collapsed');
        }
    }
});
