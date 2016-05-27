import Ember from 'ember';
const { Promise } = Ember.RSVP;

export default function hasBrowserFeatures() {
    let features = Ember.A(['flexbox']);

    return new Promise(function(resolve) {
        let hasFeatures = features.every((feature) => {
            return Modernizr[feature];
        });
        resolve(hasFeatures);
    });
}
