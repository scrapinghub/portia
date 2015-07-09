import Ember from 'ember';
import NotificationManager from '../utils/notification-manager';

export default Ember.Mixin.create({
    showNotification: NotificationManager.showNotification.bind(NotificationManager),
    showSuccessNotification: NotificationManager.showSuccessNotification.bind(NotificationManager),
    showWarningNotification: NotificationManager.showWarningNotification.bind(NotificationManager),
    showErrorNotification: NotificationManager.showErrorNotification.bind(NotificationManager),
});
