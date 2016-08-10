import DS from 'ember-data';

export default DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),
    fields: DS.hasMany(),
    items: DS.hasMany()
});
