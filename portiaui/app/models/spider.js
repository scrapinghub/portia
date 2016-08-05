import DS from 'ember-data';


const Spider = DS.Model.extend({
    name: DS.attr('string'),
    startUrls: DS.attr('startUrl', {
        defaultValue() {
            return [];
        }
    }),
    respectNofollow: DS.attr('boolean'),
    pageActions: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),
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
    followPatterns: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),
    excludePatterns: DS.attr('array', {
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
    jsEnablePatterns: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),
    jsDisablePatterns: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),

    samples: DS.hasMany({
        async: true
    })
});

export default Spider;
