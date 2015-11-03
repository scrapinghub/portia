import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNameBindings: ['active'],

    active: Ember.computed('toolId', 'group.selected', function() {
        return this.get('group.selected') === this.get('toolId');
    }),

    didInsertElement() {
        if (!this.$().prev().length) {
            Ember.run.schedule('afterRender', () => {
                if (!this.get('group.selected')) {
                    this.send('selectTab');
                }
            });
        }
    },

    actions: {
        selectTab() {
            this.get('group').send('selectTab', this.get('toolId'));
        }
    }
});
