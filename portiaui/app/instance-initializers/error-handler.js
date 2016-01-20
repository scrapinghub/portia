import Ember from 'ember';

export function initialize(applicationInstance) {
    const notificationManager = applicationInstance.lookup('service:notification-manager');
    function notifyError(err) {
        if (err.name === 'HTTPError') {
            if (!err.data) {
                console.log(err.message);
            }
        } else {
            console.log(err);
        }

        notificationManager.add({
            title: err.title || 'Unexpected error',
            message: err.name === 'HTTPError' && err.data && err.data.detail ? err.data.detail :
                'An unexpected error has occurred. Please notify the developers. ' +
                'Details have been logged to the console.',
            type: err.status === 400 ? 'warning' : 'danger'
        });
    }

    Ember.onerror = notifyError;

    applicationInstance.ApplicationRoute = Ember.Route.extend({
        actions: {
            error: notifyError
        }
    });
}

export default {
    name: 'error-handler',
    initialize: initialize
};
