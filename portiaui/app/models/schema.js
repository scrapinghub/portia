import DS from 'ember-data';

const Schema = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),
    items: DS.hasMany()
});

export default Schema;
