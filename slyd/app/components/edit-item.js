import Ember from 'ember';
import NotificationHandler from '../mixins/notification-handler';

export default Ember.Component.extend(NotificationHandler, {
    item: null,
    items: null,
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
        },

        validateFieldName: function(input) {
            var text = input.text;

            // Ensuring that field names start with a letter prevents overwriting
            // _item, _template and any future "protected" property we might
            // add to extracted items.
            if (!/^[a-z]/i.test(text)) {
                return input.setInvalid('Field names must start with a letter');
            } else if (text === 'url') {
                return input.setInvalid('Naming a field "url" is not allowed as there is already a field with this name');
            } else if (this.get('item.fields').findBy('name', text)) {
                return input.setInvalid('There is already a field with that name.');
            }
        },

        validateItemName: function(input){
            if (this.get('items').findBy('name', input.text)) {
                input.setInvalid('There is already a item with that name.');
            }
        }
    }
});
