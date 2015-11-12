import DS from 'ember-data';


const Spider = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo({
        async: true
    }),
    startUrls: DS.attr('array'),
    samples: DS.hasMany({
        async: true
    })
});

export default Spider;
