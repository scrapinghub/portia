import Ember from 'ember';

export function ensurePromise(valueOrPromise) {
    return new Ember.RSVP.Promise(function(resolve) {
        resolve(valueOrPromise);
    });
}

export default {
    ensurePromise
};
