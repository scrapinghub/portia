import Ember from 'ember';

var NotificationManager = Ember.Object.create({
    content: Ember.A(),

    add: function(options) {
        /*
            properties:
                title (optional),
                message,
                type (optional): info (default), warning, success, danger
        */
        var notification = Ember.Object.create(options);
        return this.get('content').pushObject(notification);
    },

    showNotification: function(title, message, type) {
        if (title && !message) {
            message = title;
            title = null;
        }
        if (message) {
            this.add({
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

export default NotificationManager;
