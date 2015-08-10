import DS from 'ember-data';

const Sample = DS.Model.extend({
    name: DS.attr('string'),
    spider: DS.belongsTo(),
    items: DS.hasMany({
        async: true
    })
});

Sample.reopenClass({
    FIXTURES: [
        {
            id: 't1',
            name: 'buy-owls-online',
            spider: 's1',
            items: [
                'ti1'
            ]
        }
    ]
});

export default Sample;
