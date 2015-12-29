import DS from 'ember-data';


const Spider = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),

    // json fixes error with storing ember NativeArray in indexed db
    startUrls: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),

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
