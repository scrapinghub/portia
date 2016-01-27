import Ember from 'ember';

export default Ember.Component.extend({
    spider: null,

    actions: {
        toggleShowLinks() {
            const spider = this.get('spider');
            spider.toggleProperty('showLinks');
            spider.save();
        }
    }
});
