import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'form',

    browserState: Ember.inject.service(),

    backDisabled: Ember.computed.or('disabled', 'noBackUrl'),
    disabled: Ember.computed.readOnly('browserState.disabled'),
    forwardDisabled: Ember.computed.or('disabled', 'noForwardUrl'),
    loading: Ember.computed.readOnly('browserState.loading'),
    noBackUrl: Ember.computed.equal('browserState.backBuffer.length', 0),
    noForwardUrl: Ember.computed.equal('browserState.forwardBuffer.length', 0),
    url: Ember.computed.reads('browserState.url'),
    inputUrl: null,
    urlChanged: Ember.computed('url', 'browserState.url', function() {
        return this.get('url') !== this.get('browserState.url');
    }),
    updateUrl: Ember.observer('browserState.url', function() {
        this.set('url', this.get('browserState.url'));
        this.set('inputUrl', null);
    }),

    submit() {
        var browser = this.get('browserState');
        if (this.get('urlChanged')) {
            browser.go(this.get('url'));
        } else {
            browser.reload();
        }
    },

    actions: {
        back() {
            this.get('browserState').back();
        },

        forward() {
            this.get('browserState').forward();
        },

        restoreInputUrl() {
            var inputUrl = this.get('inputUrl');
            if (inputUrl !== null) {
                this.set('url', inputUrl);
            }
        },

        revertInputUrl() {
            this.set('inputUrl', this.get('url'));
            this.set('url', this.get('browserState.url'));
        }
    }
});
