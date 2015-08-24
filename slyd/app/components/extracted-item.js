import Ember from 'ember';

export default Ember.Component.extend({
    extractedItem: null,

    fields: Ember.computed.reads('extractedItem.fields'),

    textFields: function() {
        return this.get('fields').filter(function(field) {
            return field.get('type') !== 'image';
        });
    }.property('fields'),

    imageFields: function() {
        return this.get('fields').filter(function(field) {
            return field.get('type') === 'image';
        });
    }.property('fields'),

    variants: Ember.computed.reads('extractedItem.variants'),

    matchedTemplate: Ember.computed.reads('extractedItem.matchedTemplate'),

    url: Ember.computed.reads('extractedItem.url'),

    actions: {
        loadUrl: function() {
            this.sendAction('loadUrl', this.get('url'));
        },

        editTemplate: function(templateName) {
            this.sendAction('editTemplate', templateName);
        }
    },
});
