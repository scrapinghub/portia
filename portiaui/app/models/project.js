import DS from 'ember-data';

const Project =  DS.Model.extend({
    name: DS.attr('string'),
    spiders: DS.hasMany({
        async: true
    }),
    schemas: DS.hasMany({
        async: true
    })
});

export default Project;
