import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    actions: {
        addSpider() {
            this.get('dispatcher').addSpider();
        }
    }
});
