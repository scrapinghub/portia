import DS from "ember-data";

export default DS.JSONAPISerializer.extend({
    normalize(modelClass, resourceHash) {
        const resource = this._super(...arguments);
        // add resource instance link to data, we use this to resolve the url
        // for subsequent requests
        if (resourceHash.links) {
            resource.data.links = resourceHash.links;
        }
        return resource;
    },

    serialize(snapshot, options) {
        const json = this._super(...arguments);

        // partial serialization based on the partial option
        if (options && options.partial) {
            const data = json.data;

            let keys = new Set();
            for (let key of options.partial) {
                let payloadKey = this._getMappedKey(key, snapshot.type);
                if (payloadKey === key) {
                    payloadKey = this.keyForAttribute(key, 'serialize');
                }
                keys.add(payloadKey);
            }

            for (let field of Object.keys(data.attributes)) {
                if (!keys.has(field)) {
                    delete data.attributes[field];
                }
            }
            if (!Object.keys(data.attributes).length) {
                delete data.attributes;
            }

            for (let field of Object.keys(data.relationships)) {
                if (!keys.has(field)) {
                    delete data.relationships[field];
                }
            }
            if (!Object.keys(data.relationships).length) {
                delete data.relationships;
            }
        }

        return json;
    }
});
