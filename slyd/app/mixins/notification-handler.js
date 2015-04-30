import Ember from 'ember';
import NotificationManager from '../utils/notification-manager';

export default Ember.Mixin.create({
    showNotification: function(title, message, type) {
        if (title && !message) {
            message = title;
            title = null;
        }
        if (message) {
            NotificationManager.add({
                title: title,
                message: message,
                type: type || 'info'
            });
        }
    },

    showSuccessNotification: function(title, message) {
        this.showNotification(title, message, 'success');
    },

    showWarningNotification: function(title, message) {
        this.showNotification(title, message, 'warning');
    },

    showErrorNotification: function(title, message) {
        this.showNotification(title, message, 'danger');
    }
});
