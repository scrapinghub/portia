import Ember from 'ember';

export default Ember.Route.extend({
    redirect(model, transition) {
        this.transitionTo('projects.project.spider.sample.data', {
            queryParams: transition.queryParams
        });
    }
});
