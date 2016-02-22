import DS from 'ember-data';

export default DS.Model.extend({
    type: DS.attr('string'),
    value: DS.attr('string'),
    project: DS.belongsTo(),
    annotations: DS.hasMany()
});
