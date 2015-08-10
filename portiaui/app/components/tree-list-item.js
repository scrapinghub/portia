import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['tree-list-item'],
    classNameBindings: ['collapsed'],
    collapsed: Ember.computed.reads('item.collapsed'),

    actions: {
        toggleCollapsed() {
            this.toggleProperty('collapsed');
        }
    }
});
