import Ember from 'ember';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend({
    tagName: '',

    browser: service(),
    dispatcher: service(),

    url: computed.readOnly('browser.url'),
    emptyUrl: computed.not('url'),
    disableStartUrl: computed.or('emptyUrl', 'browser.invalidUrl'),

    newStartUrl: computed('url', 'spider.startUrls.[]', function() {
        const url = this.get('url');
        const startUrls = this.get('spider.startUrls').mapBy('url');
        return url && !startUrls.includes(url);
    }),

    actions: {
        toggleStartUrl() {
            if (this.get('emptyUrl')) {
                return;
            }
            this._toggleStartUrl();
        }
    },

    _toggleStartUrl() {
        if (this.get('newStartUrl')) {
            this.get('dispatcher').addStartUrl(this.get('spider'),
                                               this.get('url'));
        } else {
            this.get('dispatcher').removeStartUrl(this.get('spider'),
                                                  this.get('_startUrl'));
        }
    },
    _startUrl: computed('spider.startUrls.[]', 'url', function() {
        return this.get('spider.startUrls')
                   .findBy('url', this.get('url'));
    })
});
