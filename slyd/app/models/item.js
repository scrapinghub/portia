import SimpleModel from './simple-model';
import ItemField from './item-field';

export default SimpleModel.extend({
    serializedRelations: ['fields'],
    serializedProperties: ['name'],
    fields: null,

    validateName: function(name) {
        return /^[A-Za-z0-9_-]+$/g.test(name);
    },

    isValid: function() {
        return this.validateName(this.get('name')) && this.get('fields').reduce(
            function(previousValue, field){
                return previousValue && this.validateName(field.get('name'));
            }.bind(this), true
        );
    },

    addField: function(name, type) {
        var newField = ItemField.create({ name: name || 'new_field',
                                          type: type || 'text',
                                          required: false,
                                          vary: false });
        this.get('fields').pushObject(newField);
    }
});
