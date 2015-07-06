import Ember from 'ember';
import NotificationHandler from '../mixins/notification-handler';

export default Ember.Component.extend(NotificationHandler, {
    item: null,
    itemFields: null,
    extractionTypes: [],

    updateFields: function() {
        this.set('itemFields', (this.getWithDefault('item.fields', []) || []).copy());
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
            var error = null;

            // Ensuring that field names start with a letter prevents overwriting
            // _item, _template and any future "protected" property we might
            // add to extracted items.
            if (!/^[a-z]/i.test(text)) {
                error = 'Field names must start with a letter';
            } else if (text === 'url') {
                error = 'Naming a field "url" is not allowed as there is already a field with this name';
            } else if (this.get('item.fields').findBy('name', text)) {
                error = 'There is alrready a field with that name.';
            }

            if(error) {
                // Reset name to it's original value
                var field = this.get('item.fields').get(index);
                if (field) {
                    field.set('name', this.get('itemFields').get(index).name);
                    this.get('item.fields').replace(index, 1, [field]);
                }
                this.showErrorNotification(error);
            } else {
                this.updateFields();
            }
        }
    }
});
