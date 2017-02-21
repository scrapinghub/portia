import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize: function(serialized) {
    if (Array.isArray(serialized)) {
        return serialized;
    }
    return [];
  },

  serialize: function(deserialized) {
    if (Array.isArray(deserialized)) {
        return deserialized;
    }
    return [];
  }
});
