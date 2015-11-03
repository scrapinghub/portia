import Ember from 'ember';


export default Ember.Component.extend({
    browser: Ember.inject.service(),

    tagName: 'form',

    autofocus: false,

    backDisabled: Ember.computed.or('disabled', 'noBackUrl'),
    disabled: Ember.computed.readOnly('browser.disabled'),
    forwardDisabled: Ember.computed.or('disabled', 'noForwardUrl'),
    loading: Ember.computed.readOnly('browser.loading'),
    modeDescription: Ember.computed.readOnly('browser.modeDescription'),
    noBackUrl: Ember.computed.equal('browser.backBuffer.length', 0),
    noForwardUrl: Ember.computed.equal('browser.forwardBuffer.length', 0),
    url: Ember.computed.reads('browser.url'),
    updateUrl: Ember.observer('browser.url', function() {
        this.set('url', this.get('browser.url'));
    }),

    submit() {
        this.send('submit', ...arguments);
        return false;
    },

    actions: {
        back() {
            this.get('browser').back();
        },

        forward() {
            this.get('browser').forward();
        },

        submit() {
            this.get('browser').go(this.get('url'));
        }
    }
});
