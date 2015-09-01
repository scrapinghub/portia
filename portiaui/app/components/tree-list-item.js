import Ember from 'ember';


export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['tree-list-item'],
    classNameBindings: ['active', 'childActive', 'collapsed'],

    collapsed: null,

    active: Ember.computed.readOnly('item.active'),
    childActive: Ember.computed.readOnly('item.hasActiveChild'),
    doNotRenderCollapsedChildren: Ember.computed.reads('item.doNotRenderCollapsedChildren'),
    doNotRenderChildren: Ember.computed.and('doNotRenderCollapsedChildren', 'collapsed'),

    init() {
        this._super();
        this.set('collapsed', !!this.get('item.collapsed'));
    },

    keepChildren: Ember.observer('doNotRenderChildren', function() {
        // keep child DOM after it has been rendered once
        const doNotRenderChildren = this.get('doNotRenderChildren');
        if (!doNotRenderChildren) {
            this.set('doNotRenderCollapsedChildren', false);
        }
    }),

    actions: {
        toggleCollapsed() {
            this.toggleProperty('collapsed');
        }
    }
});
