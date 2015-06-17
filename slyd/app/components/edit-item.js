import Ember from 'ember';
import NotificationHandler from '../mixins/notification-handler';

export default Ember.Component.extend(NotificationHandler, {
    item: null,
    itemFields: null,
    extractionTypes: [],

    updateFields: function() {
        this.set('itemFields', this.getWithDefault('item.fields', []).copy());
    }.on('init'),

    actions: {
        addField: function() {
            this.sendAction('addField', this.get('item'));
            this.updateFields();
        },

        deleteField: function(field) {
            this.sendAction('deleteField', this.get('item'), field);
            this.updateFields();
        },

        delete: function() {
            this.sendAction('delete', this.get('item'));
        },

        editField: function(text, index) {
            if (text === 'url') {
                var field = this.get('item.fields').get(index);
                if (field) {
                    field.set('name', this.get('itemFields').get(index).name);
                    this.get('item.fields').replace(index, 1, [field]);
                }
                this.showErrorNotification('Naming a field "url" is not allowed as there is already a field with this name');
                return;
            }
            this.updateFields();
        }
    }
});
