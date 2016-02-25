import Ember from 'ember';

// http://stackoverflow.com/questions/28247401/how-can-i-test-if-a-function-is-returning-a-promise-in-ember
export default function ensurePromise(x) {
    return new Ember.RSVP.Promise(function(resolve) {
        resolve(x);
    });
}