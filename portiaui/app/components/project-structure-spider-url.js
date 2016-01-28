import Ember from 'ember';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    spider: null,
    url: null,

    viewUrl: Ember.computed('url', {
        get() {
            return this.get('url');
        },

        set(key, value, oldValue) {
            this.send('saveStartUrl', oldValue, value);
            return value;
        }
    }),

    actions: {
        loadStartUrl() {
            const url = this.get('url');
            if (url) {
                this.set('browser.url', url);
            }
        },

        removeStartUrl() {
            const spider = this.get('spider');
            const url = this.get('url');
            this.get('dispatcher').removeStartUrl(spider, url);
        },

        saveStartUrl(oldUrl, newUrl) {
            const spider = this.get('spider');
            if (oldUrl !== newUrl) {
                if (!newUrl) {
                    this.get('dispatcher').removeStartUrl(spider, oldUrl);
                } else if (!oldUrl) {
                    this.get('dispatcher').addStartUrl(spider, newUrl);
                } else {
                    this.get('dispatcher').replaceStartUrl(spider, oldUrl, newUrl);
                }
            }
        }
    }
});
