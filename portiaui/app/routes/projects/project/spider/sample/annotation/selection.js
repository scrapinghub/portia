import Ember from 'ember';

export default Ember.Route.extend({
    deactivate() {
        this.modelFor('projects.project.spider.sample.annotation').rollbackAttributes();
    }
});
