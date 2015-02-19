import SimpleModel from './simple-model';

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
});
