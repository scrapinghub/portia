import Ember from 'ember';
import DS from 'ember-data';
import BaseModel from './base';

export default BaseModel.extend({
    name: DS.attr('string'),
    nameAlias: Ember.computed('id', 'name', {
        get() {
            return this.get('name') || this.get('id');
        },
        set(key, value) {
            this.set('name', value);
            return value;
        }
    }),

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
    // move to ui state?
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
    }),

    firstUrl: Ember.computed('startUrls.firstObject', function() {
        const urls = this.get('startUrls').filterBy('type', 'url');
        return (urls.length !== 0) ? urls[0].url : undefined;
    }),

    localImages: DS.attr('boolean', {
        defaultValue: false
    }),

    // country and currency codes
    countryCode: DS.attr('string', {
        defaultValue: ''
    }),

    currencyCode: DS.attr('string', {
        defaultValue: 'EGP'
    }),

    useLanguageConfig: DS.attr('boolean', {
        defaultValue: false
    }),

    useCurrencyConfig: DS.attr('boolean', {
        defaultValue: false
    }),

    englishURL: DS.attr('string', {
        defaultValue: ''
    }),

    englishUrlArgs: DS.attr('string', {
        defaultValue: ''
    }),

    arabicURL: DS.attr('string', {
        defaultValue: ''
    }),

    arabicUrlArgs: DS.attr('string', {
        defaultValue: ''
    }),

    useLanguageCookies: DS.attr('boolean', {
        defaultValue: false
    }),

    useCurrencyCookies: DS.attr('boolean', {
        defaultValue: false
    }),

    englishCookieName: DS.attr('string', {
        defaultValue: ''
    }),

    englishCookieValue: DS.attr('string', {
        defaultValue: ''
    }),

    arabicCookieName: DS.attr('string', {
        defaultValue: ''
    }),
    arabicCookieValue: DS.attr('string', {
        defaultValue: ''
    }),

    currencyCookieName: DS.attr('string', {
        defaultValue: ''
    }),

    currencyCookieValue: DS.attr('string', {
        defaultValue: ''
    }),

    user: DS.attr('string', {
        defaultValue: ''
    }),

    userAlias: Ember.computed('username', 'user', {
         get() {
             return this.get('user') || this.get('username');
         },
         set(key, value) {
             this.set('user', value);
             return value;
         }
     }),


});
