import Ember from 'ember';
import hasBrowserFeatures from '../utils/browser-features';

function identity(x) { return x; }

export default Ember.Route.extend({
    redirect() {
        hasBrowserFeatures().then((features) => {
            let hasFeatures = features.every(identity);
            let nextRoute = hasFeatures ? 'projects' : 'browsers';
            this.replaceWith(nextRoute);
        });
    }
});
