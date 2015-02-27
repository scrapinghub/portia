import Ember from 'ember';

export default Ember.Component.extend({
    extractedItem: null,

    fields: function() {
        return this.get('extractedItem.fields');
    }.property('extractedItem'),

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

    variants: function() {
        return this.get('extractedItem.variants');
    }.property('extractedItem'),

    matchedTemplate: function() {
        return this.get('extractedItem.matchedTemplate');
    }.property('extractedItem'),

    url: function() {
        return this.get('extractedItem.url');
    }.property('extractedItem'),

    actions: {
        fetchPage: function() {
            this.sendAction('fetchPage', this.get('url'));
        },

        editTemplate: function(templateName) {
            this.sendAction('editTemplate', templateName);
        }
    },
});
