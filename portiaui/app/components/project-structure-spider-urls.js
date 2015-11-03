import Ember from 'ember';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    spider: null,

    init() {
        this._super();
        this.set('newUrl', false);
    },

    actions: {
        addStartUrl(spider) {
            let newUrl = this.get('browser.url') || '';
            const urls = spider.get('startUrls');
            if (newUrl && urls.includes(newUrl)) {
                newUrl = '';
            }
            if (newUrl) {
                this.get('dispatcher').addStartUrl(spider, newUrl);
            }
            this.setProperties({
                newUrl: true,
                urlValue: newUrl
            });
        }
    }
});
