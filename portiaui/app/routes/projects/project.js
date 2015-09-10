import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('project', params.project_id);
    },

    setupController: function(controller, model) {
        this._super(controller, model);
        controller.set('projects', this.controllerFor('projects'));
    },

    renderTemplate() {
        this.render({
            into: 'application',
            outlet: 'main'
        });

        this.render('top-url-bar', {
            into: 'application',
            outlet: 'top-url-bar'
        });

        this.render('side-bar', {
            into: 'application',
            outlet: 'side-bar'
        });
    }
});
