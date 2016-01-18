import Ember from 'ember';

export default Ember.Component.extend({
    notificationManager: Ember.inject.service(),

    classNames: ['notifications'],

    _banners: [],
    _notifications: [],

    banners: Ember.computed('_banners.[]', 'notificationManager.banners.[]', function() {
        const lastBanners = this.get('_banners');
        const banners = this.get('notificationManager.banners');
        for (let banner of lastBanners) {
            Ember.set(banner, 'fading', true);
        }
        for (let banner of banners) {
            Ember.set(banner, 'fading', undefined);
        }
        lastBanners.addObjects(banners);
        return lastBanners;
    }),
    notifications: Ember.computed('_notifications.[]', 'notificationManager.notifications.[]',
        function() {
            const lastNotifications = this.get('_notifications');
            const notifications = this.get('notificationManager.notifications');
            for (let notification of lastNotifications) {
                Ember.set(notification, 'fading', true);
            }
            for (let notification of notifications) {
                Ember.set(notification, 'fading', undefined);
            }
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
            this.get('_banners').removeObject(banner);
        },

        fadeNotification(notification) {
            this.get('_notifications').removeObject(notification);
        }
    }
});
