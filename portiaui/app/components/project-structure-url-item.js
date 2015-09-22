import Ember from 'ember';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    actions: {
        openPage() {
            const url = this.get('item.name');
            this.set('browser.url', url);
        },

        removeStartUrl() {
            const url = this.get('item.name');
            const spider = this.get('item.spider.content');
            this.get('dispatcher').removeStartUrl(url, spider);
        }
    }
});
