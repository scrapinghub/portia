import Ember from 'ember';
const { inject: { service } } = Ember;

export default Ember.Route.extend({
    browser: service(),
    changes: service(),
    notificationManager: service(),
    uiState: service(),

    beforeModel() {
        this.store.unloadAll('spider');
        this.store.unloadAll('schema');
        this.set('uiState.currentSpider', null);
    },

    model(params) {
        this.set('projectId', params.project_id);
        return this.store.findRecord('project', params.project_id);
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

    projectNotFound() {
        const id = this.get('projectId');
        const errorMsg = `Project with id '${id}' not found.`;
        this.get('notificationManager').showErrorNotification(errorMsg);
    },

    actions: {
        error: function() {
            this.projectNotFound();
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
