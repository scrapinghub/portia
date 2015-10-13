import DS from 'ember-data';

export const FIELD_TYPES = [
    'date', 'geopoint', 'image', 'number', 'price', 'raw html', 'safe html', 'text', 'url'];

export default DS.Model.extend({
    name: DS.attr('string'),
    type: DS.attr('string'),
    schema: DS.belongsTo({
        async: true
    }),
    annotations: DS.hasMany({
        async: true
    })
});
