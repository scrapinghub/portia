import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    api: Ember.inject.service(),
    notificationManager: Ember.inject.service(),
    hasSpider: computed.bool('currentSpider'),

    actions: {
        runSpider(spider) {
            this.get('api').post('schedule', {
                model: spider,
                jsonData: {data: {type: 'spiders', id: spider.id}}
            }).then(() => {
                this.get('notificationManager').showNotification(
                    'Your spider has been scheduled successfully');
            }, data => {
                let error = data.errors[0];
                if (error.status > 499) {
                    throw data;
                }
                this.get('notificationManager').showNotification(error.title, error.detail);
            });
        }
    }
});