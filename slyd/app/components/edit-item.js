import Ember from 'ember';
import NotificationHandler from '../mixins/notification-handler';

export function validateFieldName(name, fields) {
    // Ensuring that field names don't start with underscores prevents
    // overwriting _item, _template and any future "protected" property
    // we might add to extracted items.
    if (/^_/.test(name)) {
        return "Field can't start with underscores";
    } else if (name === 'url') {
        return 'Naming a field "url" is not allowed as there is already a field with this name';
    } else if (fields.findBy('name', name)) {
        return 'There is already a field with that name.';
    }
    return null; // No error
}

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

        validateFieldName: function(input){
            var error = validateFieldName(input.text, this.get('item.fields'));
            if(error) {
                input.setInvalid(error);
            }
        },

        validateItemName: function(input){
            if (this.get('items').findBy('displayName', input.text)) {
                input.setInvalid('There is already a item with that name.');
            }
        }
    }
});
