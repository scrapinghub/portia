import DS from 'ember-data';


const Spider = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),
    startUrls: DS.attr(),
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
            startUrls: [
                'owlkingdom.com'
            ],
            samples: [
                't1'
            ]
        }
    ]
});

export default Spider;
