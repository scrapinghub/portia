import Ember from 'ember';
const { Promise } = Ember.RSVP;

export default function hasBrowserFeatures() {
    let features = ['flexbox', 'mutationobserver'];

    return new Promise(function(resolve) {
        let hasFeatures = features.map((feature) => {
            return Modernizr[feature];
        }).every();
        resolve(hasFeatures);
    });
}
