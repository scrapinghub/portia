import DS from 'ember-data';


const Spider = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo({
        async: true
    }),
    startUrls: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),
    linksToFollow: DS.attr('string'),
    jsEnabled: DS.attr('boolean'),
    respectNofollow: DS.attr('boolean'),
    followPatterns: DS.attr('array'),
    excludePatterns: DS.attr('array'),
    jsEnablePatterns: DS.attr('array'),
    jsDisablePatterns: DS.attr('array'),
    pageActions: DS.attr('json', {
    project: DS.belongsTo(),

    // login
    performLogin: DS.attr('boolean'),
    loginUrl: DS.attr('string'),
    loginUser: DS.attr('string'),
    loginPassword: DS.attr('string'),

    // links
    linksToFollow: DS.attr('string', {
        defaultValue: 'all'
    }),
    followPatterns: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),
    excludePatterns: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),
    showLinks: DS.attr('boolean'),
    respectNoFollow: DS.attr('boolean', {
        defaultValue: true
    }),

    // JS
    jsEnabled: DS.attr('boolean'),
    jsEnablePatterns: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),
    jsDisablePatterns: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),

    samples: DS.hasMany({
        async: true
    })
});

export default Spider;
