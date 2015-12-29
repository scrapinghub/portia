import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('project', params.project_id);
    },

    afterModel() {
        this.store.findAll('schema');
        this.store.findAll('field');
        this.store.findAll('spider');
        this.store.findAll('sample');
        this.store.findAll('item');
        this.store.findAll('item-annotation');
        this.store.findAll('annotation');
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

        this.render('projects/project/structure', {
            into: 'application',
            outlet: 'side-bar'
        });

        this.render('options-panels', {
            into: 'application',
            outlet: 'options-panels'
        });

        this.render('tool-panels', {
            into: 'application',
            outlet: 'tool-panels'
        });

        this.render('projects/project/toolbar', {
            into: 'projects/project',
            outlet: 'browser-toolbar'
        });
    },

    actions: {
        error: function() {
            this.transitionTo('projects');
        }
    }
});
