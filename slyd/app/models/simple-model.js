import Ember from 'ember';

export default Ember.Object.extend(Ember.Copyable, {
    idBinding: 'name',
    name: null,
    serializedProperties: null,
    serializedRelations: null,

    copy: function() {
        return Ember.run(this.constructor, 'create', this);
    },

    serialize: function() {
        var serialized = this.getProperties(this.get('serializedProperties'));
        if (!Ember.isEmpty(this.get('serializedRelations'))) {
            this.get('serializedRelations').forEach(function(relation) {
                if (!Ember.isEmpty(this.get(relation))) {
                    serialized[relation] = this.get(relation).map(function(relatedObject) {
                        return relatedObject.serialize();
                    });
                } else {
                    serialized[relation] = [];
                }
            }.bind(this));
        }
        return serialized;
    },
});
