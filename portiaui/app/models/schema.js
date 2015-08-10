import DS from 'ember-data';

const Schema = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),
    items: DS.hasMany()
});

Schema.reopenClass({
    FIXTURES: [
        {
            id: 'i1',
            name: 'Owl',
            project: 'p1',
            items: [
                'ti1'
            ]
        },
        {
            id: 'i2',
            name: 'Detail',
            project: 'p1',
            items: []
        }
    ]
});

export default Schema;
