import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['tool-panel'],
    classNameBindings: ['selected::hide'],
    selected: Ember.computed('toolId', 'group.selected', function() {
        return this.get('group.selected') === this.get('toolId');
    }),

    willInsertElement() {
        this.attrs.group.value.register(this);
    },

    willDestroyElement() {
        this.attrs.group.value.unregister(this);
    }
});
