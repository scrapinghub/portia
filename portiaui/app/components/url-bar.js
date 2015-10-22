import Ember from 'ember';


export default Ember.Component.extend({
    browser: Ember.inject.service(),

    tagName: 'form',

    inputUrl: null,

    backDisabled: Ember.computed.or('disabled', 'noBackUrl'),
    disabled: Ember.computed.readOnly('browser.disabled'),
    forwardDisabled: Ember.computed.or('disabled', 'noForwardUrl'),
    loading: Ember.computed.readOnly('browser.loading'),
    modeDescription: Ember.computed.readOnly('browser.modeDescription'),
    noBackUrl: Ember.computed.equal('browser.backBuffer.length', 0),
    noForwardUrl: Ember.computed.equal('browser.forwardBuffer.length', 0),
    url: Ember.computed.reads('browser.url'),
    urlChanged: Ember.computed('url', 'browser.url', function() {
        return this.get('url') !== this.get('browser.url');
    }),
    updateUrl: Ember.observer('browser.url', function() {
        this.set('url', this.get('browser.url'));
        this.set('inputUrl', null);
    }),

    submit() {
        var browser = this.get('browser');
        if (this.get('urlChanged')) {
            browser.go(this.get('url'));
        } else {
            browser.reload();
        }
        return false;
    },

    actions: {
        back() {
            this.get('browser').back();
        },

        forward() {
            this.get('browser').forward();
        },

        restoreInputUrl() {
            var inputUrl = this.get('inputUrl');
            if (inputUrl !== null) {
                this.set('url', inputUrl);
            }
        },

        revertInputUrl() {
            this.set('inputUrl', this.get('url'));
            this.set('url', this.get('browser.url'));
        }
    }
});
