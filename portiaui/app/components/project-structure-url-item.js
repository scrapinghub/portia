import Ember from 'ember';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    url: Ember.computed.reads('item.name'),

    actions: {
        openPage() {
            const url = this.get('item.name');
            this.set('browser.url', url);
        },

        removeStartUrl() {
            const spider = this.get('item.spider.content');
            const url = this.get('item.name');
            this.get('dispatcher').removeStartUrl(spider, url);
        },

        saveStartUrl() {
            const oldUrl = this.get('item.name');
            const newUrl = this.get('url');
            if (oldUrl !== newUrl) {
                const spider = this.get('item.spider.content');
                this.get('dispatcher').replaceStartUrl(spider, oldUrl, newUrl);
            }
        }
    }
});
