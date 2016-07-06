import Ember from 'ember';

export default Ember.Route.extend({
    redirect(model, {queryParams}) {
        this.transitionTo('projects.project.spider.sample.data', {
            /* The queryParams in the transition object have been processed and keys with empty
               values have been removed. If we use the same object for the new transition the
               unspecified values will keep their current values. This means we can't automatically
               pass through query parameters that have intentionally been emptied. */
            queryParams: Ember.assign({
                url: null,
                baseurl: null
            }, queryParams)
        });
    }
});
