import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),

    model(params) {
        return this.store.peekRecord('project', params.project_id);
    },

    afterModel(model) {
        return Ember.RSVP.all([
            model.reload(),
            model.checkChanges()]);
    },

    setupController(controller, model) {
        this._super(controller, model);
        controller.set('projects', this.controllerFor('projects'));
    },

    deactivate() {
        this.set('browser.url', null);
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
        },

        conflict() {
            this.transitionTo('projects.project.conflicts');
        },

        reload() {
            this.transitionTo('projects.project');
            this.store.unloadAll('spider');
            this.store.unloadAll('schema');
            this.refresh();
        }
    }
});
