import SimpleModel from './simple-model';

export default SimpleModel.extend({

    serializedProperties: function() {
        var serializedProperties = ['name'];
        if (this.get('regular_expression')) {
            serializedProperties.pushObject('regular_expression');
        } else {
            serializedProperties.pushObject('type_extractor');
        }
        return serializedProperties;
    }.property('regular_expression', 'type_extractor'),

    regular_expression: null,
    type_extractor: null,
});
