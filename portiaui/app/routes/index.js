import Ember from 'ember';
import hasBrowserFeatures from '../utils/browser-features';

function identity(x) { return x; }

export default Ember.Route.extend({
    model() {
        return hasBrowserFeatures();
    },

    redirect(model) {
        let hasFeatures = model.every(identity);
        let nextRoute = hasFeatures ? 'projects' : 'browsers';
        this.replaceWith(nextRoute);
    }
});
