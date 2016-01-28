import DS from 'ember-data';

const Project =  DS.Model.extend({
    name: DS.attr('string'),
    spiders: DS.hasMany(),
    schemas: DS.hasMany()
});

export default Project;
