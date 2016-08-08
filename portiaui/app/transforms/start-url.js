import DS from 'ember-data';
import startUrl from '../models/start-url';

export default DS.Transform.extend({
  deserialize: function(serialized) {
    if (Array.isArray(serialized)) {
        return serialized.map((url) => startUrl(url));
    }
    return [];
  },

  serialize: function(deserialized) {
    if (Array.isArray(deserialized)) {
        return deserialized.map((startUrl) => startUrl.serialize());
    }
    return [];
  }
});
