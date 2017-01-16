import Ember from 'ember';

export default Ember.Component.extend({
    notificationManager: Ember.inject.service(),

    classNames: ['notifications'],

    _banners: [],
    _notifications: [],

    banners: Ember.computed('_banners.[]', 'notificationManager.banners.[]', function() {
        const lastBanners = this.get('_banners');
        const banners = this.get('notificationManager.banners');
        lastBanners.addObjects(banners);
        return lastBanners;
    }),
    notifications: Ember.computed('_notifications.[]', 'notificationManager.notifications.[]',
        function() {
            const lastNotifications = this.get('_notifications');
            const notifications = this.get('notificationManager.notifications');
            lastNotifications.addObjects(notifications);
            return lastNotifications;
        }),

    displayNotifications: Ember.computed('banners.length', 'notifications.[]', function() {
        const numBanners = this.get('banners.length');
        const notifications = this.get('notifications');
        return notifications.slice(0, Math.max(0, 4 - numBanners));
    }),

    actions: {
        dismissNotification(notification) {
            this.get('notificationManager.notifications').removeObject(notification);
        },

        fadeBanner(banner) {
            Ember.set(banner, 'fading', true);
            this.get('_banners').removeObject(banner);
        },

        fadeNotification(notification) {
            Ember.set(notification, 'fading', true);
            this.get('_notifications').removeObject(notification);
        }
    }
});
