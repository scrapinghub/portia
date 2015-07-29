import Ember from 'ember';
import ExtractedField from './extracted-field';
import ExtractedVariant from './extracted-variant';

export default Ember.Object.extend({
    definition: null,
    extracted: null,
    matchedTemplate: null,

    url: Ember.computed.reads('extracted.url'),

    fields: function() {
        var fields = [],
            item = this.get('extracted');
        Object.keys(item).forEach(function(key) {
            var fieldDefinition = this.get('definition.fields').findBy('display_name', key);
            if (!fieldDefinition) {
                fieldDefinition = this.get('definition.fields').findBy('name', key);
            }
            if (fieldDefinition) {
                fields.pushObject(ExtractedField.create(
                    { name: fieldDefinition.getWithDefault('display_name', fieldDefinition.get('name')),
                      type: fieldDefinition.get('type'),
                      value: item[key] }));
            }
        }.bind(this));
        return fields;
    }.property('extracted', 'definition'),

    variants: function() {
        var variants = [],
            item = this.get('extracted');
        if (!Ember.isEmpty(item['variants'])) {
            item.variants.forEach(function(variant) {
                var fields = [];
                Object.keys(variant).forEach(function(key) {
                    fields.pushObject(ExtractedField.create(
                        { name: key, type: 'variant', value: variant[key] }));
                }.bind(this));
                variants.pushObject(ExtractedVariant.create({ fields: fields }));
            }.bind(this));
        }
        return variants;
    }.property('extracted', 'definition'),
});
