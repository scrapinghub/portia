import DS from 'ember-data';
import startUrl from '../models/start-url';

export default DS.Transform.extend({
  deserialize: function(serialized) {
    if (Array.isArray(serialized)) {
        return serialized.map((url) => {
            let spec = typeof(url) === 'string' ? {url: url} : url;
            return startUrl(spec);
        });
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
