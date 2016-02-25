import Ember from 'ember';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    tagName: '',
    urlValue: '',

    init() {
        this._super();
        this.set('newUrl', false);
    },

    actions: {
        addUrl() {
            let newUrl = this.get('browser.url') || '';
            const urls = this.get('urls');
            if (newUrl && urls.includes(newUrl)) {
                newUrl = '';
            }
            if (newUrl) {
                this.sendAction('saveUrl', null, newUrl);
            }
            this.setProperties({
                newUrl: true,
                urlValue: newUrl
            });
        },

        saveUrl(oldUrl, newUrl) {
            this.sendAction('saveUrl', oldUrl, newUrl);
        }
    }

});
