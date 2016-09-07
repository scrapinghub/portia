import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        const spider = this.modelFor('projects.project.spider');
        return spider.get('startUrls').objectAt(params.start_url_id);
    }
});
