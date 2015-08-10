import DS from 'ember-data';

const Spider = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),
    start_urls: DS.attr(),
    samples: DS.hasMany({
        async: true
    })
});

Spider.reopenClass({
    FIXTURES: [
        {
            id: 's1',
            name: 'owlkingdom.com',
            project: 'p1',
            start_urls: [
                'owlkingdom.com'
            ],
            samples: [
                't1'
            ]
        }
    ]
});

export default Spider;
