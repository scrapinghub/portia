import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    api: Ember.inject.service(),
    notificationManager: Ember.inject.service(),
    hasSpider: computed.bool('spider'),

    actions: {
        trainSpider(spider) {
            if (this.get('spider.countryCode') && this.get('spider.username')){
                this.get('notificationManager').showNotification('Please wait');
                this.get('api').post('train', {
                model: spider,
                jsonData: {data: {type: 'spiders', id: spider.id, username: spider.username}}
                }).then(() => {
                    this.get('notificationManager').showNotification(
                        'Your spider has been trained successfully');
                }, data => {
                    let error = data.errors[0];
                    if (error.status > 499) {
                        throw data;
                    }
                    this.get('notificationManager').showNotification(error.title, error.detail);
                });
            }
            else{
                var errorTitle = "Your spider can not be trained!";
                var errorMessage = "CHECK if the spider has a country and specify your username below";
                this.get('notificationManager').showNotification(errorTitle, errorMessage);
            }
        }
    }
});
