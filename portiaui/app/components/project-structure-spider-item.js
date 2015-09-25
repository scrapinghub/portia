import Ember from 'ember';


export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    actions: {
        removeSpider() {
            const spider = this.get('item.content');
            this.get('dispatcher').removeSpider(spider);
        },

        saveSpider() {
            const spider = this.get('item.content');
            spider.save();
        }
    }
});
