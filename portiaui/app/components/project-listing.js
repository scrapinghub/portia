import Ember from 'ember';

export default Ember.Component.extend({
    notificationManager: Ember.inject.service(),

    tagName: '',
    
    project: null,

    actions: {
        publish() {
            this.get('project').publish().then(data => {
                // Show user message and allow them to schedule spider
                this.get('notificationManager').showNotification(
                    data.meta.title);
            }, data => {
                let error = data.errors[0];
                if (error.status > 499) {
                    throw data;
                }
                this.get('notificationManager').showNotification(error.title, error.detail);
                if (error.status === 409) {
                    this.sendAction('conflict');
                }
            });
        },

        discard() {
            this.get('project').reset().then(() => {
                this.sendAction('reload');
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
