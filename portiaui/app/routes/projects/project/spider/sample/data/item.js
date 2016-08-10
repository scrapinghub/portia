import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.queryRecord('item', {
            id: params.item_id,
            sample_id: this.modelFor('projects.project.spider.sample').get('id'),
            sample_spider_id: this.modelFor('projects.project.spider').get('id'),
            sample_spider_project_id: this.modelFor('projects.project').get('id')
        });
    },

    actions: {
        error() {
            this.transitionTo('projects.project.spider.sample.data');
        }
    }
});
