import Ember from 'ember';

export default Ember.Route.extend({
    jobQ: Ember.inject.service(),
    browser: Ember.inject.service(),

    model(params) {
        return this.store.queryRecord('spider', {
            id: params.spider_id,
            project_id: this.projectId()
        });
    },

    afterModel(model) {
        return this.store.query('sample', {
            spider_project_id: this.projectId(),
            spider_id: model.get('id')
        });
    },

    setupController(controller, model) {
        this._super(...arguments);

        this.get('jobQ').start(this.projectId(), model.get('id'));
        Ember.run.next(function () {
            controller.activate();
        });
    },

    resetController(controller, isExiting) {
        Ember.run.next(function () {
            controller.deactivate();
            if (!isExiting) {
                controller.activate();
            }
        });
    },

    projectId() {
        return this.modelFor('projects.project').get('id');
    },

    renderTemplate() {
        this.render('projects/project/spider/structure', {
            into: 'projects/project/structure',
            outlet: 'project-structure'
        });

        this.render('projects/project/spider/overlays', {
            into: 'projects/project',
            outlet: 'browser-overlays'
        });

        this.render('projects/project/spider/tools', {
            into: 'tool-panels',
            outlet: 'tool-panels'
        });

        this.render('projects/project/spider/toolbar', {
            into: 'projects/project',
            outlet: 'browser-toolbar'
        });
    },

    actions: {
        error() {
            this.transitionTo('projects.project',
                this.modelFor('projects.project'));
        }
    }
});
