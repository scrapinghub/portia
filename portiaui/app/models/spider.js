import Ember from 'ember';
import DS from 'ember-data';
import BaseModel from './base';

export default BaseModel.extend({
    name: Ember.computed.alias('id'),
    // name: DS.attr('string'),
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

    firstUrl: Ember.computed.readOnly('startUrls.firstObject')
});
