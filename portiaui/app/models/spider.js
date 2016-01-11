import DS from 'ember-data';


const Spider = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo({
        async: true
    }),
    startUrls: DS.attr('array'),
    linksToFollow: DS.attr('string'),
    jsEnabled: DS.attr('boolean'),
    respectNofollow: DS.attr('boolean'),
    followPatterns: DS.attr('array'),
    excludePatterns: DS.attr('array'),
    jsEnablePatterns: DS.attr('array'),
    jsDisablePatterns: DS.attr('array'),
    samples: DS.hasMany({
        async: true
    })
});

export default Spider;
