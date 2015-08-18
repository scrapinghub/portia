import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['tree-list-item'],
    classNameBindings: ['collapsed'],
    collapsed: Ember.computed.reads('item.collapsed'),
    removeCollapsedChildren: Ember.computed.reads('item.removeCollapsedChildren'),
    doNotRenderChildren: Ember.computed.and('removeCollapsedChildren', 'collapsed'),
    renderChildren: Ember.computed.not('doNotRenderChildren'),

    actions: {
        toggleCollapsed() {
            this.toggleProperty('collapsed');
        }
    }
});
