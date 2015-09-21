import Ember from 'ember';


export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    actions: {
        removeStartUrl() {
            const url = this.get('item.name');
            const spider = this.get('item.spider.content');
            this.get('dispatcher').removeStartUrl(url, spider);
        }
    }
});
