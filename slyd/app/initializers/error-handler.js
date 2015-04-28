import Ember from 'ember';
import NotificationManager from '../utils/notification-manager';

export function initialize(container, application) {
    function notifyError(err) {
        if (err.name === 'HTTPError') {
            if (!err.data) {
                console.log(err.message);
            }
        } else {
            console.log(err);
        }

        NotificationManager.add({
            title: err.title || 'Unexpected error',
            message: err.name === 'HTTPError' && err.data && err.data.detail ? err.data.detail :
                'An unexpected error has occurred. Please notify the developers. ' +
                'Details have been logged to the console.',
            type: err.status === 400 ? 'warning' : 'danger'
        });
    }

    Ember.onerror = notifyError;

    application.ApplicationRoute = Ember.Route.extend({
        actions: {
            error: notifyError
        }
    });
}

export default {
    name: 'error-handler',
    initialize: initialize
};
