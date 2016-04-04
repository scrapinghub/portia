import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
    serialize(snapshot, options) {
        let data = this._super(...arguments);
        data.includes = this.serializeIncludes(snapshot, options);
        return data;
    },

    serializeIncludes(snapshot, options) {
        let includes = [];
        for (let item of snapshot.hasMany('items')) {
            this._addAnnotations(item, includes);
        }
        return includes
    },

    _addAnnotations(item, includes) {
        let data =item.belongsTo('itemAnnotation').serialize().data;
        data.id = item.id;
        includes.push(data);
        for (let annotation of item.hasMany('annotations')) {
            let data = annotation.serialize().data
            data.id = annotation.id;
            includes.push(data);
        }
        let parent = item.belongsTo('parent');
        if (!!parent) {
            this._addAnnotations(parent, includes);
        }
    }
});
