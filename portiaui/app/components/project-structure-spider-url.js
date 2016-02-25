import Ember from 'ember';

export default Ember.Component.extend({
    browser: Ember.inject.service(),

    tagName: '',

    spider: null,
    url: null,

    viewUrl: Ember.computed('url', {
        get() {
            return this.get('url');
        },

        set(key, value, oldValue) {
            this.sendAction('saveUrl', oldValue, value);
            return value;
        }
    }),

    actions: {
        loadUrl() {
            const url = this.get('url');
            if (url) {
                this.set('browser.url', url);
            }
        },

        removeUrl() {
            const url = this.get('url');
            this.sendAction('saveUrl', url, null);
        },
    }
});
