import Ember from 'ember';


export default Ember.Component.extend({
    browser: Ember.inject.service(),

    tagName: 'form',

    autofocus: false,

    backDisabled: Ember.computed.or('disabled', 'noBackUrl'),
    disabled: Ember.computed.readOnly('browser.disabled'),
    forwardDisabled: Ember.computed.or('disabled', 'noForwardUrl'),
    loading: Ember.computed.readOnly('browser.loading'),
    mode: Ember.computed.readOnly('browser.mode'),
    noBackUrl: Ember.computed.equal('browser.backBuffer.length', 0),
    noForwardUrl: Ember.computed.equal('browser.forwardBuffer.length', 0),
    url: Ember.computed.reads('browser.url'),
    updateUrl: Ember.observer('browser.url', function() {
        this.set('url', this.get('browser.url'));
    }),

    submit($event) {
        // ignore form's submit event;
        $event.stopPropagation();
        $event.preventDefault();
    },

    actions: {
        back() {
            if (!this.get('disabled')) {
                this.get('browser').back();
            }
        },

        forward() {
            if (!this.get('disabled')) {
                this.get('browser').forward();
            }
        },

        submit(url) {
            if (!this.get('disabled')) {
                this.setProperties({
                    'browser.url': url,
                    'browser.baseurl': null
                });
            }
        }
    }
});
