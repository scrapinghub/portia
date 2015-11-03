import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['tool-panel'],
    classNameBindings: ['active::hide'],

    active: Ember.computed('toolId', 'group.selected', function() {
        return this.get('group.selected') === this.get('toolId');
    })
});
