import Ember from 'ember';

export default Ember.Route.extend({
    setupController: function(controller, model) {
        this._super(controller, model);
        controller.set('sample', this.controllerFor('projects.project.spider.sample'));
    },

    renderTemplate() {
        this.render('projects/project/spider/sample/data/structure', {
            into: 'projects/project/spider/sample/structure',
            outlet: 'sample-structure'
        });
    }
});
