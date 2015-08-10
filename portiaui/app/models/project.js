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

Project.reopenClass({
    FIXTURES: [
        {
            id: 'p1',
            name: 'project1',
            spiders: [
                's1'
            ],
            schemas: [
                'i1',
                'i2'
            ]
        },
        {
            id: 'p2',
            name: 'project2',
            spiders: [],
            schemas: []
        }
    ]
});

export default Project;
