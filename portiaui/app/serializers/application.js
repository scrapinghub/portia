import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
    keyForAttribute: function(key) {
        return Ember.String.underscore(key);
    },

    keyForRelationship: function(key) {
        return Ember.String.underscore(key);
    }
});
