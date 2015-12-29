import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('item', params.item_id);
    },

    actions: {
        error() {
            this.transitionTo('projects.project.spider.sample.data');
        }
    }
});
