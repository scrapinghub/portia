import DS from 'ember-data';
import buildStartUrl from '../models/start-url';

export default DS.Transform.extend({
  deserialize: function(serialized) {
    if (Array.isArray(serialized)) {
        return serialized.map((url) => buildStartUrl(url));
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
