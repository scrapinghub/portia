import Ember from 'ember';
import NotificationHandler from '../mixins/notification-handler';
import validateFieldName from '../utils/validate-field-name';


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
            if (this.get('items').findBy('display_name', input.text)) {
                input.setInvalid('There is already a item with that name.');
            }
        }
    }
});
