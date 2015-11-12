import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('project', params.project_id);
    },

    afterModel(model) {
        // XXX: Need to wait for project id to be loaded
        Ember.run.next(this, function() {
            this.store.findAll('schema');
            this.store.findAll('spider');
            //this.store.findAll('item');
            //this.store.findAll('item-annotation');
            //this.store.findAll('annotation');
        });
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
    },

    actions: {
        error: function() {
            this.transitionTo('projects');
        }
    }
});
