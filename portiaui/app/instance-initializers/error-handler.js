import Ember from 'ember';
import DS from 'ember-data';

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
        if (err instanceof DS.AdapterError) {
            for (let error of err.errors) {
                Ember.Logger.warn(`AdapterError: ${error.title}\n${error.detail}`);
                notificationManager.add({
                    title: error.title || 'Server error',
                    message: 'An error has occurred while communicating with the server. ' +
                        'Please notify the developers. ' +
                        'Details have been logged to the console.',
                    type: +error.status >= 500 ? 'danger' : 'warning'
                });
            }
        } else {
            logErrorStack(err);
            notificationManager.add({
                title: err.title || 'Unexpected error',
                message: 'An unexpected error has occurred. Please notify the developers. ' +
                    'Details have been logged to the console.',
                type: 'danger'
            });
        }
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
