import Ember from 'ember';

export default Ember.Component.extend({
    item: null,
    extractionTypes: [],

    actions: {
        addField: function() {
            this.sendAction('addField', this.get('item'));
        },

        deleteField: function(field) {
            this.sendAction('deleteField', this.get('item'), field);
        },

        delete: function() {
            this.sendAction('delete', this.get('item'));
        }
    }
});
