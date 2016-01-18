import Ember from 'ember';

export default Ember.Service.extend({
    banners: [],
    notifications: [],

    add(options) {
        /*
            properties:
                title (optional),
                message,
                type (optional): info (default), warning, success, danger
        */
        return this.get('notifications').pushObject(options);
    },

    addBanner(options) {
        return this.get('banners').addObject(options);
    },

    removeBanner(options) {
        return this.get('banners').removeObject(options);
    },

    showNotification(title, message, type) {
        if (title && !message) {
            message = title;
            title = null;
        }
        if (message) {
            this.add({
                title,
                message,
                type: type || 'info'
            });
        }
    },

    showSuccessNotification(title, message) {
        this.showNotification(title, message, 'success');
    },

    showWarningNotification(title, message) {
        this.showNotification(title, message, 'warning');
    },

    showErrorNotification(title, message) {
        this.showNotification(title, message, 'danger');
    }
});
