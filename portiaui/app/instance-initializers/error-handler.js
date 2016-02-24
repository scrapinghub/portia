import Ember from 'ember';

function logErrorStack(e) {
    let text = e.toString();
    let stack = e.stack;
    if (stack) {
        if (!stack.startsWith(text)) {
            stack = `${text}\n${stack}`;
        }
        text = stack;
    }
    Ember.Logger.warn(text);
}

export function initialize(applicationInstance) {
    const notificationManager = applicationInstance.lookup('service:notification-manager');

    function notifyError(err) {
        if (err.name === 'HTTPError') {
            if (!err.data) {
                Ember.Logger.log(err.message);
            }
        } else {
            logErrorStack(err);
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
