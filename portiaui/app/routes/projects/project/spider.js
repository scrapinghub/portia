import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),

    model(params) {
        return this.store.queryRecord('spider', {
            id: params.spider_id,
            project_id: this.modelFor('projects.project').get('id')
        });
    },

    afterModel(model) {
        return this.store.query('sample', {
            spider_project_id: this.modelFor('projects.project').get('id'),
            spider_id: model.get('id')
        });
    },

    setupController(controller) {
        this._super(...arguments);
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
        },

        transitionToFragments(start_url_id) {
            this.transitionTo('projects.project.spider.start-url.options', start_url_id);
        },

        closeOptions() {
            let spider = this.modelFor('projects.project.spider');
            this.transitionTo('projects.project.spider', spider);
        }
    }
});
