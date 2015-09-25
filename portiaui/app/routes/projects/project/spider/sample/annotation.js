import Ember from 'ember';


export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('annotation', params.annotation_id);
    },

    actions: {
        error: function() {
            this.transitionTo('projects.project.spider.sample',
                this.modelFor('projects.project.spider.sample'));
        }
    }
});
